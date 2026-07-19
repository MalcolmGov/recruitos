import type { HiringStage } from "@/db/schema";

export const STAGE_LABELS: Record<HiringStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  technical: "Technical Test",
  references: "Reference Checks",
  offer: "Offer",
  placed: "Placed",
  rejected: "Rejected",
};

/** Board column order; rejected is shown last as a terminal column. */
export const BOARD_STAGES = [
  "applied",
  "screening",
  "interview_1",
  "interview_2",
  "technical",
  "references",
  "offer",
  "placed",
  "rejected",
] as const satisfies readonly HiringStage[];

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string,
): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null)
    return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  return formatMoney(min ?? max, currency);
}
