// lib/simulation/refill/templateRefill.ts

import { SupabaseClient } from "@supabase/supabase-js";

const POOL_TARGET = 100;
const TOLERANCE_MIN = 3.3;
const TOLERANCE_MAX = 3.7;
const MAX_ATTEMPTS_PER_TEMPLATE = 50;

export async function triggerDifficultyRefill(
  supabase: SupabaseClient,
  questionCount: 40 | 60
): Promise<void> {
  const status = await getDifficultyPoolStatus(supabase, questionCount);
  const needed = POOL_TARGET - status.available;
  if (needed <= 0) return;

  const templates = [];

  for (let i = 0; i < needed; i++) {
    const template = generateDifficultyTemplate(questionCount);
    if (!template) continue;
    templates.push(template);
  }

  await saveDifficultyTemplates(supabase, templates);
}

export function generateDifficultyTemplate(
  questionCount: 40 | 60
): {
  question_count: number;
  difficulty_distribution: any;
  target_average: number;
  tolerance_min: number;
  tolerance_max: number;
  status: string;
} | null {
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TEMPLATE; attempt++) {
    const level1 = randomInt(3, 8);
    const level2 = randomInt(10, 20);
    const level3 = randomInt(30, 45);
    const level4 = randomInt(20, 35);
    const level5 = 100 - level1 - level2 - level3 - level4;

    if (level5 < 3 || level5 > 20) continue;

    const dist = {
      level1_percent: level1,
      level2_percent: level2,
      level3_percent: level3,
      level4_percent: level4,
      level5_percent: level5,
    };

    const template = {
      question_count: questionCount,
      difficulty_distribution: dist,
      target_average: 3.5,
      tolerance_min: TOLERANCE_MIN,
      tolerance_max: TOLERANCE_MAX,
      status: "available",
    };

    if (!validateDifficultyTemplate(template, questionCount)) continue;

    return template;
  }

  return null;
}

export function validateDifficultyTemplate(template: any, questionCount: number): boolean {
  const dist = template.difficulty_distribution;

  const l1 = Math.floor((dist.level1_percent / 100) * questionCount);
  const l2 = Math.floor((dist.level2_percent / 100) * questionCount);
  const l3 = Math.floor((dist.level3_percent / 100) * questionCount);
  const l4 = Math.floor((dist.level4_percent / 100) * questionCount);
  const l5 = Math.floor((dist.level5_percent / 100) * questionCount);

  if ([l1, l2, l3, l4, l5].some((v) => v < 1)) return false;

  const totalPoints = l1 * 1 + l2 * 2 + l3 * 3 + l4 * 4 + l5 * 5;
  const average = totalPoints / questionCount;

  return average >= TOLERANCE_MIN && average <= TOLERANCE_MAX;
}

export async function saveDifficultyTemplates(
  supabase: SupabaseClient,
  templates: any[]
): Promise<void> {
  if (templates.length === 0) return;

  const { error } = await supabase.from("simulation_templates").insert(templates);

  if (error) throw new Error(`saveDifficultyTemplates failed: ${error.message}`);
}

export async function getDifficultyPoolStatus(
  supabase: SupabaseClient,
  questionCount: 40 | 60
): Promise<{ total: number; available: number }> {
  const { data, error } = await supabase
    .from("simulation_templates")
    .select("status")
    .eq("question_count", questionCount);

  if (error || !data) return { total: 0, available: 0 };

  return {
    total: data.length,
    available: data.filter((r: any) => r.status === "available").length,
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
