// How #4471 splits into the problems inside it. SplitTable runs this over the reports on every build.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unconfirmed';

// The cause rule in causes.ts can't see these: they come from reading the body. A one-day move is
// not a day/month swap, so a parser fix won't touch it. The desk keeps that list (desk-notes.json).
// Unconfirmed: a wrong date, but the body fits neither a swap nor a one-day move clearly.
export const UNCONFIRMED: readonly string[] = ['R-41417', 'R-41514'];

export const PROBLEMS: { problem: Problem; title: string; issue: string }[] = [
  { problem: 'parser', title: 'Shared parser reads day-first dates month first', issue: 'https://github.com/jovid78/mega-exer/issues/1' },
  { problem: 'hint', title: 'booking-v3 form hint says MM/DD/YYYY', issue: 'https://github.com/jovid78/mega-exer/issues/2' },
  { problem: 'one-day', title: 'Dates shift by one day, likely time zone', issue: 'https://github.com/jovid78/mega-exer/issues/3' },
  { problem: 'unconfirmed', title: 'Wrong date, cause not confirmed', issue: 'https://github.com/jovid78/mega-exer/issues/4' },
];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (UNCONFIRMED.includes(r.id)) return 'unconfirmed';
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t);
}

export type ProblemGroup = { problem: Problem | 'unplaced'; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const order: ProblemGroup['problem'][] = [...PROBLEMS.map((p) => p.problem), 'unplaced'];
  return order
    .map((problem) => {
      const rs = merged.filter((r) => (problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced') === problem);
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .filter((g) => g.reports.length > 0);
}
