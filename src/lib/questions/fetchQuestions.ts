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
        
