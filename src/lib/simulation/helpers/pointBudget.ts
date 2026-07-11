// lib/simulation/helpers/pointBudget.ts

import { SubjectBlueprint } from "@/lib/simulation/engines/topicDifficultyAllocator";

export interface PointBudget {
  subjectId: string;
  totalPoints: number;
  questionCount: number;
  floor: number;
  ceiling: number;
}

export function initializePointBudget(blueprint: SubjectBlueprint): PointBudget {
  return {
    subjectId: blueprint.subjectId,
    totalPoints: 0,
    questionCount: blueprint.questionCount,
    floor: 3.3 * blueprint.questionCount,
    ceiling: 3.7 * blueprint.questionCount,
  };
}

export function debitPointBudget(budget: PointBudget, points: number): void {
  budget.totalPoints += points;
}

export function creditPointBudget(budget: PointBudget, points: number): void {
  budget.totalPoints -= points;
}

export function computeCurrentAverage(budget: PointBudget): number {
  if (budget.questionCount === 0) return 0;
  return budget.totalPoints / budget.questionCount;
}

export function checkBudgetTolerance(budget: PointBudget): boolean {
  return budget.totalPoints >= budget.floor && budget.totalPoints <= budget.ceiling;
}

export function isBudgetAtFloor(budget: PointBudget): boolean {
  return budget.totalPoints <= budget.floor;
}

export function isBudgetAtCeiling(budget: PointBudget): boolean {
  return budget.totalPoints >= budget.ceiling;
}
