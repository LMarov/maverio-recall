-- Real full-text search for Ask, replacing "hand Claude the 50 most recent
-- meetings" with actual relevance ranking. Weighted so a match in the title
-- or objective counts for more than one buried in a decision/action/gap.
alter table meetings add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title_override, title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(objective, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(decisions::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(actions::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(gaps::text, '')), 'C')
  ) stored;

create index meetings_search_vector_idx on meetings using gin (search_vector);
