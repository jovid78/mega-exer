// How #4471 splits into the problems inside it. SplitTable runs this over the reports on every build.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day';

export const PROBLEMS: { problem: Problem; title: string; issue: string }[] = [
  { problem: 'parser', title: 'Shared parser reads day-first dates month first', issue: 'https://github.com/jovid78/mega-exer/issues/1' },
  { problem: 'hint', title: 'booking-v3 form hint says MM/DD/YYYY', issue: 'https://github.com/jovid78/mega-exer/issues/2' },
  { problem: 'one-day', title: 'Dates shift by one day, likely time zone', issue: 'https://github.com/jovid78/mega-exer/issues/3' },
];

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  // The cause these reports are counted under, when it isn't their own (one-day moves).
  filedUnder: Problem | null;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

const group = (problem: ProblemGroup['problem'], rs: Report[], filedUnder: Problem | null = null): ProblemGroup => {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, filedUnder, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
};

// Counted the desk's way: every report under its cause (causes.ts). The cause rule can't see a
// one-day move; the desk lists those in desk-notes.json and keeps them counted where they're filed.
// So the one-day row is a part of another row, not added to the total.
export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const causeGroups = (['parser', 'hint', 'unplaced'] as const).map((c) =>
    group(c, merged.filter((r) => (causeOf(r, tenantOf(r)) ?? 'unplaced') === c)),
  );
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const filedAs = [...new Set(moved.map((r) => causeOf(r, tenantOf(r))))];
  const filed = filedAs.length === 1 ? filedAs[0] : null;
  return [...causeGroups, group('one-day', moved, filed)].filter((g) => g.reports.length > 0);
}
