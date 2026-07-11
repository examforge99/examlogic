// lib/simulation/refill/topicTemplateRefill.ts

import { SupabaseClient } from "@supabase/supabase-js";

const POOL_TARGET = 100;
const MIN_TOPICS_PER_COMBO = 3;
const MAX_ATTEMPTS_PER_TEMPLATE = 50;
const MIN_QUESTIONS_PER_TOPIC = 10;

export async function triggerTopicRefill(
  supabase: SupabaseClient,
  subjectId: string
): Promise<void> {
  const status = await getTopicPoolStatus(supabase, subjectId);
  const needed = POOL_TARGET - status.available;
  if (needed <= 0) return;

  const templates = [];

  for (let i = 0; i < needed; i++) {
    const template = await generateTopicComboTemplate(supabase, subjectId);
    if (!template) continue;
    templates.push(template);
  }

  await saveTopicComboTemplates(supabase, subjectId, templates);
}

export async function generateTopicComboTemplate(
  supabase: SupabaseClient,
  subjectId: string
): Promise<{ subject_id: string; topic_ids: string[]; status: string } | null> {
  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, syllabus_weight, question_count")
    .eq("subject_id", subjectId)
    .eq("status", "active");

  if (error || !topics || topics.length < MIN_TOPICS_PER_COMBO) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TEMPLATE; attempt++) {
    const count = randomInt(MIN_TOPICS_PER_COMBO, Math.min(6, topics.length));
    const picked = weightedSample(topics, count);

    const template = {
      subject_id: subjectId,
      topic_ids: picked.map((t: any) => t.id),
      status: "available",
    };

    if (!validateTopicComboTemplate(template, topics)) continue;

    return template;
  }

  return null;
}

export function validateTopicComboTemplate(template: any, allTopics: any[]): boolean {
  const { topic_ids } = template;

  if (topic_ids.length < MIN_TOPICS_PER_COMBO) return false;

  if (new Set(topic_ids).size !== topic_ids.length) return false;

  const topicMap = new Map(allTopics.map((t: any) => [t.id, t]));
  for (const id of topic_ids) {
    const topic = topicMap.get(id);
    if (!topic || (topic.question_count ?? 0) < MIN_QUESTIONS_PER_TOPIC) return false;
  }

  return true;
}

export async function saveTopicComboTemplates(
  supabase: SupabaseClient,
  subjectId: string,
  templates: any[]
): Promise<void> {
  if (templates.length === 0) return;

  const { error } = await supabase.from("subject_topic_templates").insert(templates);

  if (error) throw new Error(`saveTopicComboTemplates failed: ${error.message}`);
}

export async function getTopicPoolStatus(
  supabase: SupabaseClient,
  subjectId: string
): Promise<{ total: number; available: number }> {
  const { data, error } = await supabase
    .from("subject_topic_templates")
    .select("status")
    .eq("subject_id", subjectId);

  if (error || !data) return { total: 0, available: 0 };

  return {
    total: data.length,
    available: data.filter((r: any) => r.status === "available").length,
  };
}

function weightedSample(items: any[], count: number): any[] {
  const result = [];
  const pool = [...items];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + (item.syllabus_weight ?? 1), 0);
    let rand = Math.random() * totalWeight;

    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].syllabus_weight ?? 1;
      if (rand <= 0) {
        result.push(pool[j]);
        pool.splice(j, 1);
        break;
      }
    }
  }

  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
