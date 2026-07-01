import { SupabaseClient } from "@supabase/supabase-js";

export interface Question {
  id: string;
  subject_id: string;
  topic_id: string;
  text: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  derived_difficulty: number | null;
  is_active: boolean;
}

export interface FetchQuestionsResult {
  questions: Question[];
  pool_exhausted: boolean;
  questions_available: number;
}

export interface FetchQuestionsParams {
  userId: string;
  mode: "quick_fire" | "campaign" | "simulation" | "sudden_death";
  count: number;
  subjectId?: string;
  topicId?: string;
  startingDifficultyBand?: number;
  playerChosenDifficulty?: "easy" | "medium" | "hard";
  englishSubjectId?: string;
  otherSubjects?: { id: string; slug: string }[];
  allowedSubjectIds?: string[];
  supabase: SupabaseClient;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildNotInClause(ids: string[]): string {
  return `(${ids.map((id: string) => `'${id}'`).join(",")})`;
}

async function getSeenQuestions(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_question_seen")
    .select("question_id, last_seen_at")
    .eq("user_id", userId);

  const map = new Map<string, string>();
  const ids: string[] = [];
  for (const row of data ?? []) {
    map.set(row.question_id, row.last_seen_at);
    ids.push(row.question_id);
  }
  return { seenMap: map, seenIds: ids };
}

/**
 * Three-tier fallback:
 * 1. Unseen questions only (excludes seenIds + excludeIds)
 * 2. If unseen pool insufficient, fill remaining with least-recently-seen
 *    (ordered by last_seen_at ASC), excluding excludeIds
 * 3. If total available < count, return all available with pool_exhausted: true
 *
 * Never uses ORDER BY RANDOM(). Fetches 2x count, shuffles unseen in JS,
 * slices to required count.
 */
async function fetchWithFallback({
  supabase,
  userId,
  count,
  filters,
  seenIds,
  seenMap,
  excludeIds = new Set<string>(),
}: {
  supabase: SupabaseClient;
  userId: string;
  count: number;
  filters: (query: any) => any;
  seenIds: string[];
  seenMap: Map<string, string>;
  excludeIds?: Set<string>;
}): Promise<{ questions: any[]; pool_exhausted: boolean; questions_available: number }> {
  // Tier 1: unseen + not already excluded
  const tier1Exclude = new Set([...seenIds, ...excludeIds]);
  const tier1ExcludeArray = Array.from(tier1Exclude);

  let q = supabase.from("questions").select("*").eq("is_active", true);
  q = filters(q);
  if (tier1ExcludeArray.length > 0) {
    q = q.not("id", "in", buildNotInClause(tier1ExcludeArray));
  }
  const { data: unseenData } = await q.limit(count * 2);
  const unseen = unseenData ?? [];

  if (unseen.length >= count) {
    return {
      questions: shuffleArray(unseen).slice(0, count),
      pool_exhausted: false,
      questions_available: unseen.length,
    };
  }

  // Tier 2: least-recently-seen fallback
  const needed = count - unseen.length;

  // Get eligible seen IDs (seen but not excluded)
  const eligibleSeenIds = seenIds.filter((id) => !excludeIds.has(id));

  if (eligibleSeenIds.length === 0) {
    return {
      questions: shuffleArray(unseen),
      pool_exhausted: true,
      questions_available: unseen.length,
    };
  }

  // Fetch LRS entries for this user, then filter to eligible ones in JS
  const { data: lrsData } = await supabase
    .from("user_question_seen")
    .select("question_id, last_seen_at")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: true })
    .limit(needed * 2);

  const lrsIds = (lrsData ?? [])
    .filter((r) => eligibleSeenIds.includes(r.question_id))
    .map((r) => r.question_id);

  if (lrsIds.length === 0) {
    return {
      questions: shuffleArray(unseen),
      pool_exhausted: true,
      questions_available: unseen.length,
    };
  }

  // Fetch seen questions with same filters
  let seenQ = supabase.from("questions").select("*").eq("is_active", true);
  seenQ = filters(seenQ);
  seenQ = seenQ.in("id", lrsIds);
  const { data: seenData } = await seenQ;
  const seenQuestions = seenData ?? [];

  // Sort by last_seen_at ASC using seenMap
  seenQuestions.sort((a: any, b: any) => {
    const aTime = new Date(seenMap.get(a.id) || "9999-12-31").getTime();
    const bTime = new Date(seenMap.get(b.id) || "9999-12-31").getTime();
    return aTime - bTime;
  });

  const combined = [...unseen, ...seenQuestions.slice(0, needed)];

  if (combined.length < count) {
    return {
      questions: combined,
      pool_exhausted: true,
      questions_available: combined.length,
    };
  }

  return {
    questions: combined,
    pool_exhausted: false,
    questions_available: combined.length,
  };
}

// ─── Mode-specific fetchers ────────────────────────────────────────────────

async function fetchQuickFire(
  supabase: SupabaseClient,
  userId: string,
  count: number,
  playerChosenDifficulty: "easy" | "medium" | "hard" | undefined,
  seenIds: string[],
  seenMap: Map<string, string>,
  allowedSubjectIds?: string[]
): Promise<FetchQuestionsResult> {
  const difficultyFilter = (q: any) => {
    if (allowedSubjectIds && allowedSubjectIds.length > 0) {
      q = q.in("subject_id", allowedSubjectIds);
    }
    if (playerChosenDifficulty === "easy") {
      return q.gte("derived_difficulty", 1).lt("derived_difficulty", 3);
    }
    if (playerChosenDifficulty === "medium") {
      return q.gte("derived_difficulty", 3).lt("derived_difficulty", 4);
    }
    if (playerChosenDifficulty === "hard") {
      return q.gte("derived_difficulty", 4).lt("derived_difficulty", 6);
    }
    return q;
  };

  const result = await fetchWithFallback({
    supabase,
    userId,
    count,
    filters: difficultyFilter,
    seenIds,
    seenMap,
  });

  if (!result.pool_exhausted && result.questions.length >= count) {
    return {
      questions: result.questions as Question[],
      pool_exhausted: false,
      questions_available: result.questions_available,
    };
  }

  // Fallback: fetch from all active questions
  const fallbackFilter = (q: any) => {
    if (allowedSubjectIds && allowedSubjectIds.length > 0) {
      q = q.in("subject_id", allowedSubjectIds);
    }
    return q;
  };

  const fallbackResult = await fetchWithFallback({
    supabase,
    userId,
    count: count - result.questions.length,
    filters: fallbackFilter,
    seenIds,
    seenMap,
    excludeIds: new Set(result.questions.map((q: any) => q.id)),
  });

  const combined = [...result.questions, ...fallbackResult.questions];
  const shuffled = shuffleArray(combined);

  return {
    questions: shuffled.slice(0, count) as Question[],
    pool_exhausted: combined.length < count,
    questions_available: result.questions_available + fallbackResult.questions_available,
  };
}

async function fetchCampaign(
  supabase: SupabaseClient,
  userId: string,
  count: number,
  subjectId: string,
  topicId: string,
  startingDifficultyBand: number | undefined,
  seenIds: string[],
  seenMap: Map<string, string>
): Promise<FetchQuestionsResult> {
  const baseFilter = (q: any) =>
    q.eq("subject_id", subjectId).eq("topic_id", topicId);

  if (
    startingDifficultyBand !== undefined &&
    startingDifficultyBand !== null
  ) {
    const bandFilter = (q: any) => {
      q = baseFilter(q);
      return q
        .gte("derived_difficulty", startingDifficultyBand)
        .not("derived_difficulty", "is", null);
    };

    const result = await fetchWithFallback({
      supabase,
      userId,
      count,
      filters: bandFilter,
      seenIds,
      seenMap,
    });

    if (!result.pool_exhausted && result.questions.length >= count) {
      return {
        questions: result.questions as Question[],
        pool_exhausted: false,
        questions_available: result.questions_available,
      };
    }

    // Fallback to all active for this subject/topic
    const fallbackResult = await fetchWithFallback({
      supabase,
      userId,
      count: count - result.questions.length,
      filters: baseFilter,
      seenIds,
      seenMap,
      excludeIds: new Set(result.questions.map((q: any) => q.id)),
    });

    const combined = [...result.questions, ...fallbackResult.questions];

    return {
      questions: combined.slice(0, count) as Question[],
      pool_exhausted: combined.length < count,
      questions_available:
        result.questions_available + fallbackResult.questions_available,
    };
  }

  // No starting band: fetch all active for subject/topic
  const result = await fetchWithFallback({
    supabase,
    userId,
    count,
    filters: baseFilter,
    seenIds,
    seenMap,
  });

  return {
    questions: result.questions as Question[],
    pool_exhausted: result.pool_exhausted,
    questions_available: result.questions_available,
  };
}

async function fetchSuddenDeath(
  supabase: SupabaseClient,
  userId: string,
  count: number,
  startingDifficultyBand: number | undefined,
  seenIds: string[],
  seenMap: Map<string, string>,
  allowedSubjectIds?: string[]
): Promise<FetchQuestionsResult> {
  if (
    startingDifficultyBand !== undefined &&
    startingDifficultyBand !== null
  ) {
    const bandFilter = (q: any) => {
      if (allowedSubjectIds && allowedSubjectIds.length > 0) {
        q = q.in("subject_id", allowedSubjectIds);
      }
      return q
        .gte("derived_difficulty", startingDifficultyBand)
        .not("derived_difficulty", "is", null);
    };

    const result = await fetchWithFallback({
      supabase,
      userId,
      count,
      filters: bandFilter,
      seenIds,
      seenMap,
    });

    if (!result.pool_exhausted && result.questions.length >= count) {
      return {
        questions: result.questions as Question[],
        pool_exhausted: false,
        questions_available: result.questions_available,
      };
    }

    // Fallback to all active
    const fallbackFilter = (q: any) => {
      if (allowedSubjectIds && allowedSubjectIds.length > 0) {
        q = q.in("subject_id", allowedSubjectIds);
      }
      return q;
    };

    const fallbackResult = await fetchWithFallback({
      supabase,
      userId,
      count: count - result.questions.length,
      filters: fallbackFilter,
      seenIds,
      seenMap,
      excludeIds: new Set(result.questions.map((q: any) => q.id)),
    });

    const combined = [...result.questions, ...fallbackResult.questions];

    return {
      questions: combined.slice(0, count) as Question[],
      pool_exhausted: combined.length < count,
      questions_available:
        result.questions_available + fallbackResult.questions_available,
    };
  }

  // No starting band
  const baseFilter = (q: any) => {
    if (allowedSubjectIds && allowedSubjectIds.length > 0) {
      q = q.in("subject_id", allowedSubjectIds);
    }
    return q;
  };

  const result = await fetchWithFallback({
    supabase,
    userId,
    count,
    filters: baseFilter,
    seenIds,
    seenMap,
  });

  return {
    questions: result.questions as Question[],
    pool_exhausted: result.pool_exhausted,
    questions_available: result.questions_available,
  };
}

async function fetchSimulation(
  supabase: SupabaseClient,
  userId: string,
  seenIds: string[],
  seenMap: Map<string, string>,
  englishSubjectId: string,
  otherSubjects: { id: string; slug: string }[]
): Promise<FetchQuestionsResult> {
  const ENGLISH_BANDS: Record<number, number> = {
    1: 6,
    2: 12,
    3: 18,
    4: 15,
    5: 9,
  };

  const OTHER_BANDS: Record<number, number> = {
    1: 4,
    2: 8,
    3: 12,
    4: 10,
    5: 6,
  };

  const allQuestions: any[] = [];
  let totalAvailable = 0;
  let anyExhausted = false;

  // ── English ─────────────────────────────────────────────────────────────
  const englishFilter = (q: any) => q.eq("subject_id", englishSubjectId);

  // Per-subject difficulty check
  const { data: englishDifficultyCheck } = await supabase
    .from("questions")
    .select("id")
    .eq("subject_id", englishSubjectId)
    .not("derived_difficulty", "is", null)
    .eq("is_active", true)
    .limit(1);

  const englishHasDifficulty = (englishDifficultyCheck ?? []).length > 0;

  if (!englishHasDifficulty) {
    const result = await fetchWithFallback({
      supabase,
      userId,
      count: 60,
      filters: englishFilter,
      seenIds,
      seenMap,
    });
    allQuestions.push(...result.questions);
    totalAvailable += result.questions_available;
    if (result.pool_exhausted) anyExhausted = true;
  } else {
    const englishFetchedIds = new Set<string>();
    let englishShortfall = 0;

    for (const [bandStr, bandCount] of Object.entries(ENGLISH_BANDS)) {
      const band = parseInt(bandStr, 10);
      const bandFilter = (q: any) => {
        q = englishFilter(q);
        if (band === 5) {
          return q.gte("derived_difficulty", 5).lt("derived_difficulty", 6);
        }
        return q
          .gte("derived_difficulty", band)
          .lt("derived_difficulty", band + 1);
      };

      const result = await fetchWithFallback({
        supabase,
        userId,
        count: bandCount,
        filters: bandFilter,
        seenIds,
        seenMap,
        excludeIds: englishFetchedIds,
      });

      allQuestions.push(...result.questions);
      result.questions.forEach((q: any) => englishFetchedIds.add(q.id));
      totalAvailable += result.questions_available;

      if (result.pool_exhausted) {
        englishShortfall += bandCount - result.questions.length;
      }
    }

    if (englishShortfall > 0) {
      const band3Filter = (q: any) => {
        q = englishFilter(q);
        return q.gte("derived_difficulty", 3).lt("derived_difficulty", 4);
      };

      const fallbackResult = await fetchWithFallback({
        supabase,
        userId,
        count: englishShortfall,
        filters: band3Filter,
        seenIds,
        seenMap,
        excludeIds: englishFetchedIds,
      });

      allQuestions.push(...fallbackResult.questions);
      fallbackResult.questions.forEach((q: any) =>
        englishFetchedIds.add(q.id)
      );
      totalAvailable += fallbackResult.questions_available;
      if (fallbackResult.pool_exhausted) anyExhausted = true;
    }
  }

  // ── Other subjects (3 subjects, 40 each) ────────────────────────────────
  for (const subject of otherSubjects) {
    const subjectFilter = (q: any) => q.eq("subject_id", subject.id);

    // Per-subject difficulty check
    const { data: subjectDifficultyCheck } = await supabase
      .from("questions")
      .select("id")
      .eq("subject_id", subject.id)
      .not("derived_difficulty", "is", null)
      .eq("is_active", true)
      .limit(1);

    const subjectHasDifficulty = (subjectDifficultyCheck ?? []).length > 0;

    if (!subjectHasDifficulty) {
      const result = await fetchWithFallback({
        supabase,
        userId,
        count: 40,
        filters: subjectFilter,
        seenIds,
        seenMap,
      });
      allQuestions.push(...result.questions);
      totalAvailable += result.questions_available;
      if (result.pool_exhausted) anyExhausted = true;
      continue;
    }

    const subjectFetchedIds = new Set<string>();
    let subjectShortfall = 0;

    for (const [bandStr, bandCount] of Object.entries(OTHER_BANDS)) {
      const band = parseInt(bandStr, 10);
      const bandFilter = (q: any) => {
        q = subjectFilter(q);
        if (band === 5) {
          return q.gte("derived_difficulty", 5).lt("derived_difficulty", 6);
        }
        return q
          .gte("derived_difficulty", band)
          .lt("derived_difficulty", band + 1);
      };

      const result = await fetchWithFallback({
        supabase,
        userId,
        count: bandCount,
        filters: bandFilter,
        seenIds,
        seenMap,
        excludeIds: subjectFetchedIds,
      });

      allQuestions.push(...result.questions);
      result.questions.forEach((q: any) => subjectFetchedIds.add(q.id));
      totalAvailable += result.questions_available;

      if (result.pool_exhausted) {
        subjectShortfall += bandCount - result.questions.length;
      }
    }

    if (subjectShortfall > 0) {
      const band3Filter = (q: any) => {
        q = subjectFilter(q);
        return q.gte("derived_difficulty", 3).lt("derived_difficulty", 4);
      };

      const fallbackResult = await fetchWithFallback({
        supabase,
        userId,
        count: subjectShortfall,
        filters: band3Filter,
        seenIds,
        seenMap,
        excludeIds: subjectFetchedIds,
      });

      allQuestions.push(...fallbackResult.questions);
      fallbackResult.questions.forEach((q: any) =>
        subjectFetchedIds.add(q.id)
      );
      totalAvailable += fallbackResult.questions_available;
      if (fallbackResult.pool_exhausted) anyExhausted = true;
    }
  }

  return {
    questions: allQuestions as Question[],
    pool_exhausted: anyExhausted || allQuestions.length < 180,
    questions_available: allQuestions.length,
  };
}

// ─── Main export ───────────────────────────────────────────────────────────

export async function fetchQuestions({
  userId,
  mode,
  count,
  subjectId,
  topicId,
  startingDifficultyBand,
  playerChosenDifficulty,
  englishSubjectId,
  otherSubjects,
  allowedSubjectIds,
  supabase,
}: FetchQuestionsParams): Promise<FetchQuestionsResult> {
  const { seenIds, seenMap } = await getSeenQuestions(supabase, userId);

  switch (mode) {
    case "quick_fire":
      return fetchQuickFire(
        supabase,
        userId,
        count,
        playerChosenDifficulty,
        seenIds,
        seenMap,
        allowedSubjectIds
      );

    case "campaign":
      if (!subjectId || !topicId) {
        throw new Error("campaign mode requires subjectId and topicId");
      }
      return fetchCampaign(
        supabase,
        userId,
        count,
        subjectId,
        topicId,
        startingDifficultyBand,
        seenIds,
        seenMap
      );

    case "simulation":
      if (!englishSubjectId || !otherSubjects || otherSubjects.length !== 3) {
        throw new Error(
          "simulation mode requires englishSubjectId and exactly 3 otherSubjects"
        );
      }
      return fetchSimulation(
        supabase,
        userId,
        seenIds,
        seenMap,
        englishSubjectId,
        otherSubjects
      );

    case "sudden_death":
      return fetchSuddenDeath(
        supabase,
        userId,
        count,
        startingDifficultyBand,
        seenIds,
        seenMap,
        allowedSubjectIds
      );

    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}
