import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../db/pool';
import { resetDb } from '../testDb';
import { retrieveMeetings } from './retrieval';

async function insertMeeting(overrides: {
  title?: string;
  summary?: string;
  objective?: string;
  occurredAt: string;
}): Promise<string> {
  const { rows } = await pool.query(
    `insert into meetings (title, practice, occurred_at, summary, objective)
     values ($1, 'Consulting', $2, $3, $4) returning id`,
    [overrides.title || 'Untitled meeting', overrides.occurredAt, overrides.summary || '', overrides.objective || '']
  );
  return rows[0].id;
}

beforeEach(async () => {
  await resetDb();
});

describe('retrieveMeetings', () => {
  it('ranks a meeting whose content actually matches the question above unrelated ones', async () => {
    const warehouseId = await insertMeeting({
      title: 'Pilot scope walkthrough',
      objective: 'Confirm the Midlands warehouse as the pilot logistics site',
      occurredAt: '2026-01-10T10:00:00.000Z'
    });
    const budgetId = await insertMeeting({
      title: 'Quarterly budget review',
      summary: 'Discussed headcount forecast and board approval for next quarter.',
      occurredAt: '2026-01-12T10:00:00.000Z'
    });

    const results = await retrieveMeetings('what did we decide about the warehouse pilot site');
    const ids = results.map((r) => r.id);

    expect(ids[0]).toBe(warehouseId);
    expect(ids).toContain(budgetId); // still present via recency fallback, just not ranked first
  });

  it('falls back to recency-ordering when nothing in the corpus matches the question', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      ids.push(
        await insertMeeting({
          title: `Untitled catch-up ${i}`,
          summary: 'Routine internal check-in, nothing specific on the agenda.',
          occurredAt: `2026-01-0${i + 1}T10:00:00.000Z`
        })
      );
    }

    const results = await retrieveMeetings('xylophone quokka zephyr platypus gibberish', 30, 3);
    expect(results.length).toBe(3);
    // Most recent three, newest first (i=4,3,2 given ascending dates above).
    expect(results.map((r) => r.id)).toEqual([ids[4], ids[3], ids[2]]);
  });

  it('blends real matches with recency fallback to reach the floor, without duplicates', async () => {
    const matchId = await insertMeeting({
      title: 'Contract renewal terms',
      objective: 'Negotiate the annual retainer renewal',
      occurredAt: '2026-01-01T10:00:00.000Z'
    });
    const fillerIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      fillerIds.push(
        await insertMeeting({
          title: `Filler ${i}`,
          summary: 'Nothing about the topic in question.',
          occurredAt: `2026-01-0${i + 2}T10:00:00.000Z`
        })
      );
    }

    const results = await retrieveMeetings('annual retainer renewal', 30, 4);
    const ids = results.map((r) => r.id);

    expect(ids[0]).toBe(matchId); // the real match ranks first
    expect(ids.length).toBe(4); // topped up to the floor
    expect(new Set(ids).size).toBe(ids.length); // no duplicates between matched + fallback
  });
});
