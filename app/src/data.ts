// Ported verbatim (data + helpers) from the Claude Design prototype
// `project/Maverio Recall.dc.html`. Practice colours, people, mock meetings
// and the mock Q&A answer bank all match the original prototype content.

export type PracticeName = 'Consulting' | 'Growth iQ' | 'Capability' | 'Internal';

export interface PracticeMeta {
  c: string;
  t: string;
}

export const AQ1 = '#4192B9';
export const AQ2 = '#5AC3A7';

export const PR: Record<PracticeName, PracticeMeta> = {
  Consulting: { c: '#7835FE', t: 'rgba(120,53,254,.12)' },
  'Growth iQ': { c: '#27AC53', t: 'rgba(39,172,83,.12)' },
  Capability: { c: '#FF6A00', t: 'rgba(255,106,0,.12)' },
  Internal: { c: '#4192B9', t: 'rgba(65,146,185,.13)' }
};

export interface PersonMeta {
  n: string;
  c: string;
  r: string;
}

export type PersonKey = 'DO' | 'PR' | 'TL' | 'NF' | 'MB' | 'IK' | 'RS' | 'EK';

export const P: Record<PersonKey, PersonMeta> = {
  DO: { n: 'Lana Marov', c: '#4192B9', r: 'Strategy Director · Maverio' },
  PR: { n: 'Priya Raman', c: '#27AC53', r: 'Growth iQ lead · Maverio' },
  TL: { n: 'Tom Lasky', c: '#7835FE', r: 'Delivery · Maverio' },
  NF: { n: 'Nadia Fenn', c: '#FF6A00', r: 'Capability · Maverio' },
  MB: { n: 'Marcus Bell', c: '#C9A24A', r: 'Partner · Maverio' },
  IK: { n: 'Ines Kovač', c: '#0195BD', r: 'COO · Hartline Logistics' },
  RS: { n: 'Ray Sandoval', c: '#88DB0D', r: 'CFO · Verdon Health' },
  EK: { n: 'Elena Kessler', c: '#AC51F6', r: 'Managing Partner · Kessler & Roe' }
};

export const ini = (n: string) =>
  n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export const replaceAll = (str: string, find: string, rep: string) => str.split(find).join(rep);

export const hm = (v: string | number) => {
  const n = parseInt(String(v), 10) || 0;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? (m ? h + 'h ' + m + 'm' : h + 'h') : m + 'm';
};

export const wave = (seed: number) =>
  Array.from({ length: 32 }, (_, i) => ({
    h: (18 + Math.abs(Math.sin(seed + i * 0.9)) * 80).toFixed(0) + '%'
  }));

export interface Decision {
  text: string;
  cite: string;
}

export interface Gap {
  q: string;
  why: string;
  cite: string;
  answer?: string;
}

export interface Action {
  who: PersonKey | string;
  text: string;
  due: string;
  src?: string;
}

export interface Field {
  key: string;
  val: string;
}

export interface Line {
  t: string;
  k: string;
  text: string;
}

export interface Meeting {
  id: string;
  title: string;
  client: string;
  practice: PracticeName;
  dow: string;
  day: string;
  mon: string;
  time: string;
  dur: string;
  dec: number;
  act: number;
  people: string[];
  unknown: number;
  summary: string;
  decisions: Decision[];
  objective: string;
  objectiveCite: string;
  gaps: Gap[];
  actions: Action[];
  fields: Field[];
  lines: Line[];
  /**
   * Lifecycle of a live-recorded meeting: 'transcribing' (audio saved, waiting
   * on Deepgram/mock transcript), 'analysing' (transcript ready, AI analysis
   * pending), 'done' (fully processed). Seed meetings have no stage (always done).
   */
  stage?: 'transcribing' | 'analysing' | 'done';
  fresh?: boolean;
  durLabel?: string;
  date?: string;
  /** Drafts never reach the company knowledge base until published. */
  published?: boolean;
  publishedBy?: string;
  publishedAt?: string;
  titleEdited?: boolean;
}

export const MEET: Meeting[] = [
  {
    id: 'm1',
    published: false,
    title: 'Diagnostic readout',
    client: 'Hartline Logistics',
    practice: 'Consulting',
    dow: 'FRI',
    day: '4',
    mon: 'SEP',
    time: '10:00',
    dur: '62 min',
    dec: 3,
    act: 5,
    people: ['DO', 'TL', 'IK'],
    unknown: 1,
    summary:
      'Hartline accepted the diagnostic: their cost-to-serve problem is routing discipline, not headcount. Ines pushed back on the 90-day timeline and we agreed to a phased delivery with a paid pilot on the Midlands depot first. Fee discussion landed at £84k for phase one, with phase two contingent on pilot metrics.',
    decisions: [
      { text: 'Phase delivery — Midlands depot pilot first, national rollout gated on a 6% cost-to-serve improvement.', cite: 'm1 · 18:42 · Ines Kovač' },
      { text: 'Phase one fee set at £84,000, invoiced monthly across three months.', cite: 'm1 · 41:07 · Lana Marov' },
      { text: 'Tom embeds two days a week on site rather than running it remote.', cite: 'm1 · 52:19 · Tom Lasky' }
    ],
    objective: 'Get Hartline to fund delivery without signing the 90-day national programme they were resisting.',
    objectiveCite: '18:42 · Ines Kovač',
    gaps: [
      { q: 'Who is the finance owner for the pilot budget line?', why: 'Ines said she can get £84k through finance without a board paper, but never named a person.', cite: '41:44 · Ines Kovač' },
      { q: 'What is the deadline for “send it this week”?', why: 'The SOW was committed to “this week” with no date said aloud.', cite: '41:44 · Ines Kovač' }
    ],
    actions: [
      { who: 'TL', text: 'Draft the pilot scope and the depot data request', due: 'Mon 8 Sep', src: '26:38 · Tom Lasky' },
      { who: 'DO', text: 'Send the phased SOW with the £84,000 phase-one fee', due: '“this week” — no date stated', src: '41:07 · Lana Marov' },
      { who: 'IK', text: 'Take the £84k pilot budget line through finance', due: 'not stated', src: '41:44 · Ines Kovač' },
      { who: 'TL', text: 'Arrange the depot walkthrough via Priya, who runs that calendar', due: 'not stated', src: '58:02 · Ines Kovač' }
    ],
    fields: [
      { key: 'client', val: 'Hartline Logistics' },
      { key: 'engagement_stage', val: 'Diagnostic → Delivery (proposal out)' },
      { key: 'practice', val: 'Consulting' },
      { key: 'revenue_mentioned', val: '£84,000 phase one · £210,000 indicative phase two' },
      { key: 'risks', val: 'Timeline pressure; depot data quality unverified' },
      { key: 'decision_maker', val: 'Ines Kovač (COO)' },
      { key: 'next_step', val: 'Phased SOW by 9 Sep' }
    ],
    lines: [
      { t: '00:12', k: 'DO', text: 'Before we get into the numbers — the short version is that we came in expecting a headcount story and the data told us something different.' },
      { t: '00:31', k: 'IK', text: 'Different how? Because the board has been told this is a staffing problem for two years.' },
      { t: '01:04', k: 'TL', text: 'Cost-to-serve variance across your depots is 34%. Same volumes, same vehicle mix. That is routing discipline, not people.' },
      { t: '02:20', k: 'IK', text: 'That is going to be an awkward conversation upstairs, but I would rather have it now.' },
      { t: '18:42', k: 'IK', text: 'I am not signing a 90-day national programme on a slide. Give me one depot, give me a number I can hold you to, and I will fund the rest.' },
      { t: '19:15', k: 'DO', text: 'Then we phase it. Midlands depot pilot, six percent improvement in cost-to-serve as the gate, national rollout after.' },
      { t: '26:03', k: '?1', text: 'Sorry — can I ask about the data extract? Our warehouse system only keeps eight weeks of route history.' },
      { t: '26:38', k: 'TL', text: 'Eight weeks is enough for the pilot baseline. We will need a longer pull before rollout.' },
      { t: '41:07', k: 'DO', text: 'Phase one is eighty-four thousand, invoiced monthly across the three months. Phase two we scope after the gate.' },
      { t: '41:44', k: 'IK', text: 'That I can get through finance without a board paper. Send it this week.' },
      { t: '52:19', k: 'TL', text: 'One condition from my side — I want two days a week on site. Remote delivery on a routing problem does not work.' },
      { t: '58:02', k: 'IK', text: 'Fine. Talk to Priya about the depot walkthrough, she runs that calendar.' }
    ]
  },
  {
    id: 'm2',
    published: false,
    title: 'Pricing model review',
    client: 'Verdon Health',
    practice: 'Growth iQ',
    dow: 'THU',
    day: '3',
    mon: 'SEP',
    time: '14:30',
    dur: '48 min',
    dec: 2,
    act: 3,
    people: ['PR', 'MB', 'RS'],
    unknown: 0,
    summary:
      'Verdon wants the Growth iQ benchmark data licensed rather than delivered as a report. Ray floated an annual seat model; Priya held the line on the report plus a data addendum. Real signal here: three of their competitors have asked us the same thing this quarter — there is a product in this.',
    decisions: [
      { text: 'Sell the Q4 benchmark as a report plus a data addendum, not a seat licence.', cite: 'm2 · 22:10 · Priya Raman' },
      { text: 'Price the addendum at £18k annually, renewable with the report cycle.', cite: 'm2 · 35:50 · Marcus Bell' }
    ],
    objective: 'Keep Verdon on the report model while giving them enough data access to renew.',
    objectiveCite: '22:10 · Priya Raman',
    gaps: [
      { q: 'Which data cuts does Verdon actually need in the addendum?', why: 'Priya offered “the cuts you need”; the specific cuts were never listed on the call.', cite: '22:10 · Priya Raman' },
      { q: 'Do you want the peer product idea scoped now?', why: 'Marcus noted three peers asked for the same thing, but no owner or date was agreed.', cite: '44:10 · Marcus Bell' }
    ],
    actions: [
      { who: 'PR', text: 'Send the addendum terms with the cut list for Verdon', due: 'not stated', src: '22:10 · Priya Raman' },
      { who: 'RS', text: 'Get the £18k addendum into the Q4 budget', due: 'Q4 budget cycle', src: '36:22 · Ray Sandoval' }
    ],
    fields: [
      { key: 'client', val: 'Verdon Health' },
      { key: 'engagement_stage', val: 'Renewal / upsell' },
      { key: 'practice', val: 'Growth iQ' },
      { key: 'revenue_mentioned', val: '£18,000 data addendum (annual)' },
      { key: 'risks', val: 'Client prefers seat licence; IP exposure on raw benchmark' },
      { key: 'decision_maker', val: 'Ray Sandoval (CFO)' },
      { key: 'next_step', val: 'Addendum terms by 5 Sep' }
    ],
    lines: [
      { t: '00:20', k: 'RS', text: 'The report is good. What we actually want is the underlying data, in our own tooling.' },
      { t: '03:41', k: 'PR', text: 'I understand the pull. The problem is the benchmark is only defensible with our methodology attached to it.' },
      { t: '22:10', k: 'PR', text: 'Here is where I can go — the report as it stands, plus a data addendum with the cuts you need. Not a seat licence to the whole set.' },
      { t: '35:50', k: 'MB', text: 'Eighteen thousand a year for the addendum, renewing with the report. That is the number.' },
      { t: '36:22', k: 'RS', text: 'I can defend eighteen. Send it and I will get it into the Q4 budget.' },
      { t: '44:10', k: 'MB', text: 'Priya, worth noting three of their peers asked for the same thing this quarter. There is a product here.' }
    ]
  },
  {
    id: 'm3',
    published: false,
    title: 'Monday ops',
    client: 'Maverio internal',
    practice: 'Internal',
    dow: 'TUE',
    day: '2',
    mon: 'SEP',
    time: '09:00',
    dur: '24 min',
    dec: 1,
    act: 4,
    people: ['DO', 'PR', 'TL', 'NF', 'MB'],
    unknown: 0,
    summary:
      'Capacity is the constraint, not pipeline. Tom is at 110% with Hartline landing, Nadia has Kessler kickoff prep, and Marcus wants the Growth iQ product idea scoped before it gets lost. Agreed to hold new Consulting proposals for two weeks.',
    decisions: [{ text: 'Hold new Consulting proposals for two weeks until Hartline phase one is staffed.', cite: 'm3 · 14:20 · Marcus Bell' }],
    objective: 'Protect delivery capacity while Hartline lands.',
    objectiveCite: '14:20 · Marcus Bell',
    gaps: [
      { q: 'What comes off Tom, specifically?', why: 'Tom said something has to come off him at 110%; no one named which engagement.', cite: '02:15 · Tom Lasky' },
      { q: 'Who owns the data-product thread?', why: 'Priya flagged it as a signal but no owner or date was said.', cite: '19:40 · Priya Raman' }
    ],
    actions: [
      { who: 'DO', text: 'Take work off Tom before Hartline starts — item not named on the call', due: 'not stated', src: '02:15 · Tom Lasky' },
      { who: 'MB', text: 'Hold new Consulting proposals for two weeks', due: 'two weeks from 2 Sep', src: '14:20 · Marcus Bell' }
    ],
    fields: [
      { key: 'client', val: '— internal' },
      { key: 'engagement_stage', val: 'n/a' },
      { key: 'practice', val: 'Internal' },
      { key: 'revenue_mentioned', val: '—' },
      { key: 'risks', val: 'Delivery capacity at 110% for two weeks' },
      { key: 'decision_maker', val: 'Marcus Bell' },
      { key: 'next_step', val: 'iQ product one-pager by 5 Sep' }
    ],
    lines: [
      { t: '02:15', k: 'TL', text: 'If Hartline lands this week I am at a hundred and ten percent. Something has to come off me.' },
      { t: '14:20', k: 'MB', text: 'Then we hold new Consulting proposals for two weeks. Pipeline is not our problem right now, capacity is.' },
      { t: '19:40', k: 'PR', text: 'Do not lose the data-product thread. Three inbound asks in a quarter is a signal.' }
    ]
  },
  {
    id: 'm4',
    published: true,
    publishedBy: 'Lana Marov',
    publishedAt: '29 AUG',
    title: 'Capability kickoff',
    client: 'Kessler & Roe',
    practice: 'Capability',
    dow: 'FRI',
    day: '29',
    mon: 'AUG',
    time: '11:00',
    dur: '71 min',
    dec: 4,
    act: 6,
    people: ['NF', 'MB', 'EK'],
    unknown: 2,
    summary:
      'Kessler wants their senior associates to run client diagnostics themselves within two quarters. Elena was blunt that previous training did not stick because nothing changed in how work was reviewed. Agreed the programme is built around live client files, not case studies.',
    decisions: [
      { text: 'Programme runs on live client files, not case studies.', cite: 'm4 · 24:05 · Elena Kessler' },
      { text: 'Six cohorts of eight, fortnightly, over two quarters.', cite: 'm4 · 38:12 · Nadia Fenn' },
      { text: 'Partner review checklist changes at the same time or the training does not count.', cite: 'm4 · 51:30 · Elena Kessler' },
      { text: 'Fee £126k across two quarters, 40% on kickoff.', cite: 'm4 · 63:18 · Marcus Bell' }
    ],
    objective: 'Build a capability programme that changes how work is reviewed, not just what associates are taught.',
    objectiveCite: '24:05 · Elena Kessler',
    gaps: [
      { q: 'Who signs the £126k SOW, and by when?', why: 'Marcus stated the fee and milestone; no signatory or date was discussed.', cite: '63:18 · Marcus Bell' },
      { q: 'Which cohort runs hybrid, and who picks the participants?', why: 'Nadia agreed one hybrid cohort to test remote; the cohort and selection owner were not named.', cite: '45:22 · Nadia Fenn' }
    ],
    actions: [
      { who: 'NF', text: 'Build the curriculum on live client files across six fortnightly cohorts of eight', due: 'not stated', src: '38:12 · Nadia Fenn' },
      { who: 'NF', text: 'Revise the partner review checklist alongside the programme', due: 'not stated', src: '51:30 · Elena Kessler' },
      { who: 'MB', text: 'Issue the £126,000 SOW with 40% at kickoff', due: 'not stated', src: '63:18 · Marcus Bell' },
      { who: 'NF', text: 'Run one cohort hybrid to test whether it holds up remote', due: 'not stated', src: '45:22 · Nadia Fenn' }
    ],
    fields: [
      { key: 'client', val: 'Kessler & Roe' },
      { key: 'engagement_stage', val: 'Kickoff / delivery' },
      { key: 'practice', val: 'Capability' },
      { key: 'revenue_mentioned', val: '£126,000 across two quarters' },
      { key: 'risks', val: 'Prior training failed; partner review behaviour must change' },
      { key: 'decision_maker', val: 'Elena Kessler (Managing Partner)' },
      { key: 'next_step', val: 'Curriculum outline by 4 Sep' }
    ],
    lines: [
      { t: '24:05', k: 'EK', text: 'We have done training before. It did not stick because nothing changed in how the work got reviewed. Build it on live files or do not build it.' },
      { t: '38:12', k: 'NF', text: 'Six cohorts of eight, fortnightly, across two quarters. That is the shape that survives a fee-earner calendar.' },
      { t: '44:50', k: '?2', text: 'Would that include the associates in the Manchester office, or London only?' },
      { t: '45:22', k: 'NF', text: 'Both. We run one cohort hybrid to test whether it holds up remote.' },
      { t: '51:30', k: 'EK', text: 'And the partner review checklist changes at the same time. Otherwise this is theatre.' },
      { t: '63:18', k: 'MB', text: 'A hundred and twenty-six across the two quarters, forty percent at kickoff.' }
    ]
  },
  {
    id: 'm5',
    published: true,
    publishedBy: 'Lana Marov',
    publishedAt: '28 AUG',
    title: 'Discovery call',
    client: 'Northmoor Retail',
    practice: 'Consulting',
    dow: 'THU',
    day: '28',
    mon: 'AUG',
    time: '15:00',
    dur: '39 min',
    dec: 1,
    act: 2,
    people: ['DO', 'TL'],
    unknown: 1,
    summary:
      'Northmoor is shopping for a growth diagnostic but the brief is really a margin problem dressed as a demand problem. No budget confirmed. Worth a short paid diagnostic if they can name an owner.',
    decisions: [{ text: 'Offer a two-week paid diagnostic rather than a full proposal.', cite: 'm5 · 31:02 · Lana Marov' }],
    objective: 'Reframe Northmoor’s demand brief as a margin problem and sell a short paid diagnostic instead of a proposal.',
    objectiveCite: '08:14 · Lana Marov',
    gaps: [
      { q: 'Who is the budget owner at Northmoor?', why: 'No name or budget was given anywhere in the call.', cite: 'not discussed' },
      { q: 'What price goes on the two-week diagnostic?', why: 'Lana offered a paid two-week diagnostic; no figure was said aloud.', cite: '31:02 · Lana Marov' }
    ],
    actions: [{ who: 'DO', text: 'Send the two-week paid diagnostic outline', due: 'not stated', src: '31:02 · Lana Marov' }],
    fields: [
      { key: 'client', val: 'Northmoor Retail' },
      { key: 'engagement_stage', val: 'Discovery' },
      { key: 'practice', val: 'Consulting' },
      { key: 'revenue_mentioned', val: '£24,000 indicative diagnostic' },
      { key: 'risks', val: 'No named budget owner; brief mis-framed as demand' },
      { key: 'decision_maker', val: 'unconfirmed' },
      { key: 'next_step', val: 'Diagnostic outline by 1 Sep' }
    ],
    lines: [
      { t: '08:14', k: 'DO', text: 'You describe it as a demand problem, but everything you have said is about mix and markdown. That is margin.' },
      { t: '31:02', k: 'DO', text: 'Let us not write a big proposal. Two weeks, paid, and you get a diagnostic you can act on either way.' }
    ]
  },
  {
    id: 'm6',
    published: true,
    publishedBy: 'Lana Marov',
    publishedAt: '27 AUG',
    title: 'Quarterly review',
    client: 'Alcove Foods',
    practice: 'Consulting',
    dow: 'TUE',
    day: '26',
    mon: 'AUG',
    time: '13:00',
    dur: '55 min',
    dec: 2,
    act: 3,
    people: ['MB', 'TL'],
    unknown: 0,
    summary:
      'Year-one results came in at 31% revenue growth against a 25% target. Alcove wants to extend into their food-service channel. Renewal conversation moves to October.',
    decisions: [
      { text: 'Extend scope into food-service channel from Q1.', cite: 'm6 · 27:40 · Marcus Bell' },
      { text: 'Renewal pricing conversation deferred to October.', cite: 'm6 · 49:05 · Marcus Bell' }
    ],
    objective: 'Convert a 31% year-one result into a food-service extension without opening renewal pricing today.',
    objectiveCite: '27:40 · Marcus Bell',
    gaps: [{ q: 'When in October is the renewal pricing session?', why: 'Marcus deferred it to October without setting a date.', cite: '49:05 · Marcus Bell' }],
    actions: [
      { who: 'MB', text: 'Scope the food-service extension for Q1', due: 'not stated', src: '27:40 · Marcus Bell' },
      { who: 'MB', text: 'Hold renewal pricing until October', due: 'October — no date set', src: '49:05 · Marcus Bell' }
    ],
    fields: [
      { key: 'client', val: 'Alcove Foods' },
      { key: 'engagement_stage', val: 'Delivery / renewal' },
      { key: 'practice', val: 'Consulting' },
      { key: 'revenue_mentioned', val: '31% year-one revenue growth · renewal TBC' },
      { key: 'risks', val: 'Renewal price not yet anchored' },
      { key: 'decision_maker', val: 'Marcus Bell (our side)' },
      { key: 'next_step', val: 'Extension scope by 12 Sep' }
    ],
    lines: [
      { t: '04:30', k: 'TL', text: 'Thirty-one percent against a twenty-five percent target. The mix shift did more work than the pricing change.' },
      { t: '27:40', k: 'MB', text: 'Then we extend into food service from Q1. That is where the same playbook has room.' },
      { t: '49:05', k: 'MB', text: 'Renewal pricing we do in October, not today.' }
    ]
  },
  {
    id: 'm7',
    published: true,
    publishedBy: 'Lana Marov',
    publishedAt: '23 AUG',
    title: 'Stakeholder interviews',
    client: 'Verdon Health',
    practice: 'Growth iQ',
    dow: 'FRI',
    day: '22',
    mon: 'AUG',
    time: '10:30',
    dur: '44 min',
    dec: 1,
    act: 2,
    people: ['PR', 'RS'],
    unknown: 1,
    summary:
      'Six interviews condensed: the benchmark is used mostly by strategy, not finance, which is why the seat-licence idea keeps coming back. Finance only wants two charts.',
    decisions: [{ text: 'Cut the finance section of the benchmark to two charts.', cite: 'm7 · 33:15 · Priya Raman' }],
    objective: 'Work out who actually reads the benchmark before reworking it.',
    objectiveCite: '33:15 · Priya Raman',
    gaps: [
      { q: 'Which two charts does finance want kept?', why: 'Priya said finance reads two charts; the two were not identified on the recording.', cite: '33:15 · Priya Raman' },
      { q: 'Who is the strategy-side reader to design for?', why: 'Strategy was named as the real audience, but no individual was.', cite: '33:15 · Priya Raman' }
    ],
    actions: [{ who: 'PR', text: 'Rework the benchmark for the strategy reader and cut finance to two charts', due: 'not stated', src: '33:15 · Priya Raman' }],
    fields: [
      { key: 'client', val: 'Verdon Health' },
      { key: 'engagement_stage', val: 'Research' },
      { key: 'practice', val: 'Growth iQ' },
      { key: 'revenue_mentioned', val: '—' },
      { key: 'risks', val: 'Report audience mismatch with buying centre' },
      { key: 'decision_maker', val: 'Ray Sandoval (CFO)' },
      { key: 'next_step', val: 'Finance section rework by 28 Aug' }
    ],
    lines: [{ t: '33:15', k: 'PR', text: 'Finance reads two charts. Strategy reads the whole thing. We have been writing for the wrong reader.' }]
  },
  {
    id: 'm8',
    published: true,
    publishedBy: 'Lana Marov',
    publishedAt: '22 AUG',
    title: 'Weekly delivery sync',
    client: 'Hartline Logistics',
    practice: 'Consulting',
    dow: 'THU',
    day: '21',
    mon: 'AUG',
    time: '16:00',
    dur: '31 min',
    dec: 1,
    act: 2,
    people: ['TL', 'IK'],
    unknown: 1,
    summary: 'Data extract slipped a week because the warehouse system only retains eight weeks of route history. Tom rebaselined the diagnostic on a shorter window.',
    decisions: [{ text: 'Rebaseline the diagnostic on an eight-week route window.', cite: 'm8 · 12:50 · Tom Lasky' }],
    objective: 'Keep the diagnostic honest inside an eight-week data window.',
    objectiveCite: '12:50 · Tom Lasky',
    gaps: [{ q: 'Does a longer route history exist in an archive?', why: 'The eight-week limit was stated as a system retention fact; nobody checked for archives on the call.', cite: '12:50 · Tom Lasky' }],
    actions: [{ who: 'TL', text: 'Baseline the diagnostic on the eight-week route window', due: 'not stated', src: '12:50 · Tom Lasky' }],
    fields: [
      { key: 'client', val: 'Hartline Logistics' },
      { key: 'engagement_stage', val: 'Diagnostic' },
      { key: 'practice', val: 'Consulting' },
      { key: 'revenue_mentioned', val: '—' },
      { key: 'risks', val: 'Route history retention limits rollout baseline' },
      { key: 'decision_maker', val: 'Ines Kovač (COO)' },
      { key: 'next_step', val: 'Variance rerun by 25 Aug' }
    ],
    lines: [{ t: '12:50', k: 'TL', text: 'Eight weeks is what the system keeps, so eight weeks is the baseline. I would rather be honest about the window than pretend we have a year.' }]
  }
];

export interface Answer {
  match: string[];
  text: string;
  cites: { id: string; label: string }[];
}

export const ANSWERS: Answer[] = [
  {
    match: ['hartline', 'fee', '84', 'price', 'pricing'],
    text: 'Hartline phase one is £84,000, invoiced monthly across three months, with phase two scoped only after the Midlands pilot hits a 6% cost-to-serve improvement. Ines Kovač set that gate herself, so the number is safe to repeat back to her.',
    cites: [
      { id: 'm1', label: 'Diagnostic readout · 41:07' },
      { id: 'm8', label: 'Weekly sync · 12:50' }
    ]
  },
  {
    match: ['decide', 'decision', 'decided'],
    text: 'Across the last two weeks: Hartline moved to a phased delivery gated on a depot pilot; Verdon gets a report plus an £18k data addendum instead of a seat licence; Kessler & Roe agreed the programme runs on live client files and that partner review changes alongside it.',
    cites: [
      { id: 'm1', label: 'Hartline · 18:42' },
      { id: 'm2', label: 'Verdon · 22:10' },
      { id: 'm4', label: 'Kessler · 24:05' }
    ]
  },
  {
    match: ['action', 'owe', 'owner', 'who owns', 'overdue'],
    text: 'Open and owned: Tom has the Hartline pilot scope (Mon 8 Sep) and the depot walkthrough; you have the phased SOW (Tue 9 Sep); Priya owes the Verdon addendum terms (Fri 5 Sep); Nadia has the Kessler curriculum (Thu 4 Sep). Marcus is the only one carrying nothing client-facing this week.',
    cites: [
      { id: 'm1', label: 'Hartline · actions' },
      { id: 'm4', label: 'Kessler · actions' }
    ]
  },
  {
    match: ['risk', 'worry', 'concern'],
    text: 'Two risks repeat across clients. Data retention: Hartline keeps only eight weeks of route history, which caps how confidently you can baseline a national rollout. And behaviour change: Elena Kessler said outright that previous training failed because review practice never changed — the same pattern would sink the Capability programme.',
    cites: [
      { id: 'm8', label: 'Hartline · 12:50' },
      { id: 'm4', label: 'Kessler · 51:30' }
    ]
  },
  {
    match: ['product', 'licence', 'license', 'data', 'iq', 'benchmark'],
    text: 'Three Growth iQ clients asked to license the raw benchmark this quarter — Verdon most explicitly. Marcus flagged it as a product opportunity in Monday ops and owns a one-page scope due 5 Sep. Priya’s position is that the methodology has to travel with the data.',
    cites: [
      { id: 'm2', label: 'Verdon · 44:10' },
      { id: 'm3', label: 'Monday ops · 19:40' }
    ]
  },
  {
    match: ['capacity', 'team', 'busy'],
    text: 'Delivery capacity is the binding constraint, not pipeline. Tom is at 110% once Hartline lands, so you agreed to hold new Consulting proposals for two weeks and pull him off Northmoor discovery.',
    cites: [{ id: 'm3', label: 'Monday ops · 14:20' }]
  }
];

export interface ClientContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ClientRecord {
  practice: PracticeName;
  stage: string;
  address: string;
  phone: string;
  site: string;
  notes: string;
  contacts: ClientContact[];
  decisionMaker?: string;
}

export const CLIENT_DATA: Record<string, ClientRecord> = {
  'Hartline Logistics': {
    practice: 'Consulting',
    stage: 'Diagnostic → Delivery',
    address: 'Unit 4, Colmore Gate, Birmingham B3 2QD',
    phone: '+44 121 496 0188',
    site: 'hartline-logistics.co.uk',
    notes:
      'Board was told for two years that cost-to-serve was a staffing problem. Ines is the only real decision maker; finance sign-off is a formality if she has a number she set herself.',
    contacts: [
      { name: 'Ines Kovač', role: 'COO — decision maker', email: 'i.kovac@hartline-logistics.co.uk', phone: '+44 7700 900112' },
      { name: 'Sam Petrie', role: 'IT / data extracts', email: 's.petrie@hartline-logistics.co.uk', phone: '+44 121 496 0190' }
    ]
  },
  'Verdon Health': {
    practice: 'Growth iQ',
    stage: 'Renewal / upsell',
    address: '12 Marlow Court, Reading RG1 8PB',
    phone: '+44 118 402 7710',
    site: 'verdonhealth.com',
    notes: 'Finance reads two charts; strategy reads the whole report. Ray buys, but the strategy team drives the ask for raw benchmark data.',
    contacts: [{ name: 'Ray Sandoval', role: 'CFO — budget holder', email: 'r.sandoval@verdonhealth.com', phone: '+44 7700 900431' }]
  },
  'Kessler & Roe': {
    practice: 'Capability',
    stage: 'Kickoff / delivery',
    address: '8 Bedford Row, London WC1R 4BU',
    phone: '+44 20 7043 1122',
    site: 'kesslerroe.co.uk',
    notes: 'Previous training failed because partner review practice never changed. Elena will judge the programme on whether the review checklist actually shifts.',
    contacts: [{ name: 'Elena Kessler', role: 'Managing Partner', email: 'e.kessler@kesslerroe.co.uk', phone: '+44 7700 900255' }]
  },
  'Northmoor Retail': {
    practice: 'Consulting',
    stage: 'Discovery',
    address: 'Northmoor House, Leeds LS1 4AP',
    phone: '+44 113 288 4402',
    site: 'northmoorretail.co.uk',
    notes: 'Brief is framed as demand but the problem is mix and markdown. No named budget owner yet — do not write a full proposal until there is one.',
    contacts: []
  },
  'Alcove Foods': {
    practice: 'Consulting',
    stage: 'Delivery / renewal',
    address: 'Alcove Works, Bristol BS2 0QT',
    phone: '+44 117 325 6640',
    site: 'alcovefoods.com',
    notes: 'Year one delivered 31% against a 25% target. Renewal pricing is deliberately parked until October.',
    contacts: []
  },
  'Maverio internal': {
    practice: 'Internal',
    stage: '—',
    address: 'Maverio, 1 Ashwood Yard, London EC2A 3JT',
    phone: '+44 20 3900 4141',
    site: 'maverio.com',
    notes: 'Internal calls: capacity, pipeline discipline, and the Growth iQ data-product thread.',
    contacts: []
  }
};

export type Role = 'Owner' | 'Admin' | 'Member';
export type Scope = 'all' | 'attended';

export interface TeamMember {
  k?: PersonKey;
  name?: string;
  email: string;
  role: Role;
  status: 'active' | 'pending';
  seen: string;
  vp: string;
  scope: Scope;
}

export const INITIAL_TEAM: TeamMember[] = [
  { k: 'DO', email: 'lana@maverio.com', role: 'Owner', status: 'active', seen: 'active now', vp: 'enrolled', scope: 'all' },
  { k: 'PR', email: 'priya@maverio.com', role: 'Admin', status: 'active', seen: 'last call 3 Sep', vp: 'enrolled', scope: 'all' },
  { k: 'TL', email: 'tom@maverio.com', role: 'Member', status: 'active', seen: 'last call 4 Sep', vp: 'enrolled', scope: 'all' },
  { k: 'NF', email: 'nadia@maverio.com', role: 'Member', status: 'active', seen: 'last call 29 Aug', vp: 'enrolled', scope: 'attended' },
  { k: 'MB', email: 'marcus@maverio.com', role: 'Admin', status: 'active', seen: 'last call 3 Sep', vp: 'enrolled', scope: 'all' },
  { name: 'Ruth Adeyemi', email: 'ruth@maverio.com', role: 'Member', status: 'pending', seen: 'invited 5 Sep', vp: 'awaiting first call', scope: 'attended' }
];

export interface PendingVoiceDef {
  k: string;
  label: string;
  meta: string;
  hint: string;
  seed: number;
  suggest: string[];
}

export const PENDING_VOICE_DEFS: PendingVoiceDef[] = [
  {
    k: '?1',
    label: 'VOICE 1',
    meta: '4 meetings · Hartline calls',
    hint: 'Speaks after Ines, asks about warehouse systems. Calendar invite lists an unmatched attendee: Sam Petrie, IT.',
    seed: 1.2,
    suggest: ['Sam Petrie', 'Ines Kovač', 'Tom Lasky']
  },
  {
    k: '?2',
    label: 'VOICE 2',
    meta: '1 meeting · Kessler kickoff',
    hint: 'One question about the Manchester office. Invite had two unmatched attendees.',
    seed: 3.4,
    suggest: ['Owen Roe', 'Claire Adebayo', 'Elena Kessler']
  },
  {
    k: '?3',
    label: 'VOICE 3',
    meta: '2 meetings · Northmoor',
    hint: 'Low confidence — may be room audio bleed rather than a distinct speaker.',
    seed: 5.7,
    suggest: ['Northmoor attendee', 'Room audio', 'Lana Marov']
  }
];

export const PRACTICES: PracticeName[] = ['Consulting', 'Growth iQ', 'Capability', 'Internal'];
export const STAGES = ['Discovery', 'Proposal out', 'Diagnostic → Delivery', 'Kickoff / delivery', 'Renewal / upsell'];
export const CONTACT_COLORS = ['#0195BD', '#AC51F6', '#88DB0D', '#C9A24A'];
export const CLIENT_DOT_COLORS = [AQ1, '#7835FE', '#FF6A00', '#27AC53', '#C9A24A'];

export type MeetingType = 'In person' | 'Video call' | 'Phone';
export const MEETING_TYPES: MeetingType[] = ['In person', 'Video call', 'Phone'];
export const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export interface ScheduledMeeting {
  id: string;
  title: string;
  client: string;
  practice: PracticeName;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  durationMin: number;
  place: string;
  type: MeetingType;
  agenda: string[];
  outcomes: string[];
  attendees: string[];
  guests: number;
}
