import { pool } from '../db/pool';

/**
 * Ranks meetings by actual relevance to the question (Postgres full-text
 * search over title/objective/summary/decisions/actions/gaps — see migration
 * 0004) instead of just taking the most recent N. Falls back to recency for
 * whatever's left when a question's vocabulary doesn't overlap the corpus
 * (e.g. a broad "what's going on?" with no distinctive terms), so Ask never
 * comes up empty just because full-text matching found nothing.
 */
export async function retrieveMeetings(question: string, limit = 30, fallbackFloor = 15): Promise<any[]> {
  // plainto_tsquery ANDs every term together, which is too strict for a
  // natural-language question — a meeting genuinely about "the warehouse
  // pilot" shouldn't be excluded just because it never says "decide". Loosen
  // it to OR (any term counts) by rewriting the query's "&" to "|"; ts_rank
  // still rewards a document that matches more of the terms.
  const { rows: matched } = await pool.query(
    `with q as (select to_tsquery('english', replace(plainto_tsquery('english', $1)::text, ' & ', ' | ')) as query)
     select m.*, ts_rank(m.search_vector, q.query) as rank
     from meetings m, q
     where m.search_vector @@ q.query
     order by rank desc, occurred_at desc
     limit $2`,
    [question, limit]
  );
  if (matched.length >= fallbackFloor) return matched;

  const excludeIds = matched.map((m) => m.id);
  const need = fallbackFloor - matched.length;
  const { rows: recent } = await pool.query(
    `select * from meetings
     where not (id = any($1))
     order by occurred_at desc
     limit $2`,
    [excludeIds, need]
  );
  return [...matched, ...recent];
}
