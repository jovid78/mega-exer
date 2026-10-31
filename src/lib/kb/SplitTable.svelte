<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, splitTicket } from '#lib/kb/split-4471';

  let { ticket }: { ticket: number } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const info = (p: string) => PROBLEMS.find((x) => x.problem === p);
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.filter((g) => info(g.problem)).length}</strong>
  problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>status</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const p = info(g.problem)}
      <tr class:wrong={!p} class:part={g.filedUnder}>
        <td>{p?.title ?? 'no tenant on file'} <code>{g.problem}</code></td>
        <td>{g.reports.length}{#if g.filedUnder}<span class="in"> (in {g.filedUnder})</span>{/if}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td class:open={p?.status === 'open'}>{p?.status ?? ''}</td>
        <td>{#if p}<a href={p.issue}>{p.issue.split('/').slice(-3).join('/').replace('/issues/', '#')}</a>{:else}none{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups as g (g.problem)}
  {#if g.filedUnder}
    <p class="note">The {g.reports.length} <code>{g.problem}</code> reports are counted under <code>{g.filedUnder}</code>, where the desk files them by tenant. They are not added to the total.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .in, .note { color: var(--muted); font-size: 0.85em; }
  .part td:first-child { padding-left: 1.5rem; }
  .open { color: var(--warn); font-weight: 600; }
  .wrong td { background: var(--warn-bg); }
</style>
