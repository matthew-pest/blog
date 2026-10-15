/**
 * Hogbot — the AWS technical-communication deck.
 *
 * Pure data, shared by the slide components (client) and the agent's system
 * prompt (server). Keep numbers here; the slides render them and the agent
 * quotes them. Anything marked `estimate` is a presenter-supplied figure that
 * should be confirmed before it is quoted as measured.
 */

export const DECK = {
  slug: 'aws',
  path: '/presentation/aws',
  title: 'Hogbot',
  subtitle: 'Turning Slack into the front door of an investigating agent',
  event: 'AWS · Technical communication',
  presenter: 'Matt Pest',
  date: 'October 2026',
  /** Target length, for the presenter bar. */
  minutes: 20,
} as const;

export type SlideId = 'title' | 'problem' | 'solution' | 'architecture' | 'tradeoffs' | 'results' | 'close';

export interface SlideMeta {
  id: SlideId;
  /** Short name used in the progress bar and by the agent. */
  title: string;
  /** Eyebrow shown above the slide heading. */
  kicker: string;
  /** Suggested minutes on this slide. */
  minutes: number;
  /** What the slide says, in prose, for the agent and the presenter notes. */
  notes: string[];
  /** Phrases a visitor might use to ask for this slide. */
  aliases: string[];
}

export const SLIDES: SlideMeta[] = [
  {
    id: 'title',
    title: 'Hogbot',
    kicker: 'Technical communication',
    minutes: 1,
    aliases: ['title', 'start', 'beginning', 'first slide', 'cover'],
    notes: [
      'Hogbot is a Slack-native AI assistant I built for a proprietary trading firm. Traders tag it the way they used to tag a quant, and it goes and finds the answer.',
      'Twenty minutes, questions welcome at any point. The agent in the corner can drive the slides and answer questions about the deck.',
    ],
  },
  {
    id: 'problem',
    title: 'The problem',
    kicker: '01 · A screenshot and six words',
    minutes: 4,
    aliases: ['problem', 'business problem', 'the ask', 'context', 'why'],
    notes: [
      'Every day, all day, traders post screenshots of trading sequences that looked suboptimal, with a one-line question: "where were our quoters here?", "what was our queue priority on this trade?", "how much faster did we need to be?", "why didn\'t we shoot for more?".',
      'The question space is vast and open-ended and the detail provided is minimal: a picture and a few words.',
      'Quants and developers had to field these. The answer might live in Loki logs, a database table, a Parquet lake, source code across ~300 repositories (many deployed several times with different configs), or a deployment config.',
      'Only two or three people at the company knew where to look and how to investigate. Easier questions were answered by more people; when the first source didn\'t explain what the trader saw, investigations stalled at dead ends.',
      'Business need: traders change nothing about how they ask; answers arrive in minutes, not hours; the two or three experts stop being the bottleneck; the system has to handle an open-ended question space, not a fixed FAQ.',
    ],
  },
  {
    id: 'solution',
    title: 'The solution',
    kicker: '02 · Hogbot',
    minutes: 4,
    aliases: ['solution', 'how it works', 'what we built', 'overview', 'flow'],
    notes: [
      'Hogbot is an agent defined in OpenCode and reached through Slack. Slack is the interface; OpenCode is the brain; MCP servers are the hands.',
      'Flow: a trader tags Hogbot with a screenshot and a few words. Hogbot reads the screenshot and identifies the trade the trader is focused on (screenshots show anywhere from 3 to 30 trades). It picks a skill that says where to look and in what order, then investigates through MCP servers that give it native access to Loki, Prometheus, the databases and the Parquet lake, plus a local mirror of all ~300 repos (cloned on startup, fetched nightly).',
      'When it needs more information to start, or permission to take an action, it asks back in the Slack thread: human in the loop. Then it answers in the thread, briefly.',
      'Three principles: no change to the trader\'s workflow; native access to data instead of guesses; a human in the loop for ambiguity and for actions.',
      'The hardest technical piece was the screenshot: finding the interesting trade among many, with almost no text to go on.',
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    kicker: '03 · Three iterations',
    minutes: 6,
    aliases: ['architecture', 'diagram', 'design', 'system', 'iterations', 'evolution'],
    notes: [
      'v1 — Poll the cloud. Slack lives in the cloud; all our data and services sit behind a VPN. The first version had the Slack app write events to a new cloud database; an on-prem webhook proxy polled that database and called OpenCode. The agent was a planner with a fleet of subagents.',
      'v1 failed in two ways: polling added latency and a whole extra system to operate, and the planner/subagent split lost context — the main agent and the subagent sessions didn\'t share enough state to finish an investigation.',
      'v2 — Webhooks and a monolith. Slack\'s Events API now posts signed webhooks straight to the on-prem proxy, which uses Vercel\'s Slack SDK to verify, reply and run the human-in-the-loop exchange. The agent became one session — "Hogbot" — with optional worker subagents instead of mandatory ones. MCP servers gave it Loki, Prometheus, DBs and the Parquet lake natively; the repo mirror and a set of skills told it where to look.',
      'v3 — The learning loop. It was too big an undertaking to pre-write a script or tool for every kind of question, so the agent now maintains its own skills: 40–50 of them, continuously updated with content and scripts, checked into GitLab for version control and review, and available to the rest of the team. LangSmith traces every run and a nightly evaluation replays a set of known questions with known answers so regressions are caught. A scheduler lets traders ask for recurring reports.',
    ],
  },
  {
    id: 'tradeoffs',
    title: 'Tradeoffs',
    kicker: '04 · What we chose, and what it cost',
    minutes: 3,
    aliases: ['tradeoffs', 'trade-offs', 'risks', 'limitations', 'decisions', 'alternatives'],
    notes: [
      'Inbound webhooks over polling a cloud queue: seconds instead of minutes and one fewer system, at the price of an ingress path into the on-prem network — mitigated with Slack request signing and an allow-listed proxy.',
      'One agent session with optional workers over a planner with mandatory subagents: context stays in one place and answers got dramatically better; the cost is longer single contexts and parallelism only when it pays.',
      'Learning skills over pre-scripted tools: the only way to cover an open-ended question space; the risk is drift and regressions, so skills go through GitLab review and nightly evals in LangSmith.',
      'Human in the loop over full autonomy: screenshots are ambiguous and some requests take actions, so Hogbot asks; the cost is a slower turnaround on ambiguous asks.',
      'Brevity over completeness: traders read on a phone between trades; detail is one follow-up away.',
      'Limitations to be honest about: screenshot interpretation is still the weakest link; the agent is non-deterministic, so evals matter more than tests; cost scales with usage; coverage is bounded by which systems have an MCP server.',
    ],
  },
  {
    id: 'results',
    title: 'Results',
    kicker: '05 · Impact',
    minutes: 2,
    aliases: ['results', 'metrics', 'impact', 'numbers', 'outcomes', 'kpis'],
    notes: [
      'Correctness: Hogbot surfaces the right answer about nine times in ten now; the earliest iterations managed one in three at best.',
      'Speed: the human path was hours to next-day depending on who was free; Hogbot answers in minutes.',
      'Adoption: traders tag Hogbot every day and ask it to do the work a quant or developer would have done — from "what is this parameter set to" to "how much faster did we need to be" to "has this algo been trading too aggressively, and why" to "schedule a daily report running this script and DM me the results".',
      'Capability grows with the skills library: 40–50 skills today, maintained by the agent itself and reviewed by the team.',
      'The figures for time, cost and answer length on this slide are presenter estimates from operating the system, not instrumented measurements; the correctness and skills counts are tracked.',
    ],
  },
  {
    id: 'close',
    title: 'Lessons & questions',
    kicker: '06 · What I would tell my past self',
    minutes: 1,
    aliases: ['close', 'closing', 'lessons', 'questions', 'q&a', 'end', 'last slide', 'summary'],
    notes: [
      'Three lessons: put the agent where the people already are, not the other way round; give it native access and a memory it can edit, not a bigger prompt; and measure correctness every night, because a non-deterministic system drifts quietly.',
      'Questions — the agent can jump back to any slide or iteration of the architecture.',
    ],
  },
];

export const SLIDE_COUNT = SLIDES.length;
export const ARCHITECTURE_SLIDE_INDEX = SLIDES.findIndex((s) => s.id === 'architecture');

/** Resolve a loose reference ("the architecture", "3", "results") to a slide index. */
export function resolveSlide(ref: string | number): number | null {
  if (typeof ref === 'number') return ref >= 1 && ref <= SLIDE_COUNT ? ref - 1 : null;
  const t = ref.trim().toLowerCase();
  const n = Number(t);
  if (Number.isInteger(n)) return resolveSlide(n);
  const idx = SLIDES.findIndex((s) => s.id === t || s.title.toLowerCase() === t || s.aliases.some((a) => t.includes(a)));
  return idx === -1 ? null : idx;
}

// ---------------------------------------------------------------------------
// Architecture diagram
// ---------------------------------------------------------------------------

export type Zone = 'people' | 'cloud' | 'onprem';
export type NodeKind = 'people' | 'cloud' | 'proxy' | 'agent' | 'data' | 'repo' | 'skills' | 'ops';

export interface ArchNode {
  id: string;
  label: string;
  sub?: string;
  kind: NodeKind;
  /** Position and size on a 1000 × 560 canvas. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Tooltip / focus text. */
  tip: string;
  /** Set on nodes that are new or changed in this iteration. */
  changed?: boolean;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  /** Dashed: polling, feedback, or occasional paths. */
  dashed?: boolean;
  /** Reverse the flow animation (answers travelling back). */
  back?: boolean;
}

export interface ArchIteration {
  id: 1 | 2 | 3;
  name: string;
  tagline: string;
  summary: string;
  /** What changed versus the previous iteration (empty for v1). */
  changed: string[];
  /** What was wrong with it (why there was a next iteration). */
  pain?: string[];
  nodes: ArchNode[];
  edges: ArchEdge[];
}

const NW = 150;
const NH = 62;
const DW = 128;
const DH = 54;

// Shared node definitions; each iteration picks and positions them so the
// diagram can animate nodes between positions.
const n = {
  traders: (y: number): ArchNode => ({
    id: 'traders',
    label: 'Traders',
    sub: 'screenshot + a few words',
    kind: 'people',
    x: 14,
    y,
    w: 120,
    h: NH,
    tip: 'Quants, traders and developers. They keep their habit: post a screenshot of a trading sequence in Slack with a one-line question and tag Hogbot.',
  }),
  slack: (y: number): ArchNode => ({
    id: 'slack',
    label: 'Slack',
    sub: 'cloud workspace',
    kind: 'cloud',
    x: 178,
    y,
    w: NW,
    h: NH,
    tip: 'Slack is SaaS, outside the company network. Every design has to bridge from here to data that never leaves the VPN.',
  }),
  loki: (x: number, y: number): ArchNode => ({ id: 'loki', label: 'Loki', sub: 'logs', kind: 'data', x, y, w: DW, h: DH, tip: 'Grafana Loki holds the trading systems\' logs. Often the first place to look — and often not the place where the answer is.' }),
  prom: (x: number, y: number): ArchNode => ({ id: 'prom', label: 'Prometheus', sub: 'metrics', kind: 'data', x, y, w: DW, h: DH, tip: 'Latency, queue and quoting metrics. Answers "how much faster did we need to be" questions.' }),
  db: (x: number, y: number): ArchNode => ({ id: 'db', label: 'Databases', sub: 'orders, fills, configs', kind: 'data', x, y, w: DW, h: DH, tip: 'Relational tables for orders, fills, parameters and deployment configs.' }),
  parquet: (x: number, y: number): ArchNode => ({ id: 'parquet', label: 'Parquet lake', sub: 'market + trade history', kind: 'data', x, y, w: DW, h: DH, tip: 'Columnar history for replaying a sequence: what the book looked like, where our quotes were, who was ahead in the queue.' }),
  repos: (x: number, y: number): ArchNode => ({ id: 'repos', label: 'Repo mirror', sub: '~300 repos · nightly pull', kind: 'repo', x, y, w: DW, h: DH, tip: 'All repositories cloned on startup and fetched nightly. Many services are deployed several times with different configs, so the agent reads the code and the config together.' }),
};

export const ARCHITECTURE: ArchIteration[] = [
  {
    id: 1,
    name: 'Poll the cloud',
    tagline: 'A planner, a fleet of subagents, and a database in the middle',
    summary:
      'Slack posted events to a new cloud database. An on-prem proxy polled it and handed each request to an OpenCode planner, which split the work across subagents.',
    changed: [],
    pain: [
      'Polling added latency and a whole extra system to run.',
      'Context was lost between the planner and its subagent sessions; investigations stalled.',
      'Right answer about one time in three.',
    ],
    nodes: [
      n.traders(248),
      n.slack(150),
      {
        id: 'slackapp',
        label: 'Slack app',
        sub: 'writes events',
        kind: 'cloud',
        x: 178,
        y: 262,
        w: NW,
        h: NH,
        tip: 'A Slack app that received mentions and wrote them to a cloud database, because nothing in the cloud could call into the VPN.',
      },
      {
        id: 'clouddb',
        label: 'Cloud DB',
        sub: 'event queue',
        kind: 'cloud',
        x: 178,
        y: 374,
        w: NW,
        h: NH,
        tip: 'A newly created cloud database used as a queue. The on-prem side polled it every few seconds.',
      },
      {
        id: 'proxy',
        label: 'Webhook proxy',
        sub: 'on-prem · polls the queue',
        kind: 'proxy',
        x: 452,
        y: 374,
        w: NW + 10,
        h: NH,
        tip: 'A small on-prem service that polled the cloud DB, called OpenCode, and posted results back to Slack.',
      },
      {
        id: 'planner',
        label: 'OpenCode · planner',
        sub: 'decomposes the ask',
        kind: 'agent',
        x: 660,
        y: 150,
        w: NW + 20,
        h: NH,
        tip: 'The first agent design: a planner that broke each question into leads and dispatched them.',
      },
      {
        id: 'subagents',
        label: 'Subagent fleet',
        sub: 'one session per lead',
        kind: 'agent',
        x: 660,
        y: 290,
        w: NW + 20,
        h: NH,
        tip: 'Mandatory subagents, each in its own session. They did the digging but handed back summaries that dropped the detail the planner needed.',
      },
      n.loki(858, 60),
      n.db(858, 170),
      n.parquet(858, 280),
      n.repos(858, 390),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'slackapp' },
      { from: 'slackapp', to: 'clouddb' },
      { from: 'clouddb', to: 'proxy', label: 'poll', dashed: true },
      { from: 'proxy', to: 'planner' },
      { from: 'planner', to: 'subagents' },
      { from: 'subagents', to: 'loki' },
      { from: 'subagents', to: 'db' },
      { from: 'subagents', to: 'parquet' },
      { from: 'subagents', to: 'repos' },
      { from: 'subagents', to: 'planner', label: 'summaries', dashed: true, back: true },
      { from: 'proxy', to: 'slack', label: 'answer', dashed: true, back: true },
    ],
  },
  {
    id: 2,
    name: 'Webhooks and a monolith',
    tagline: 'One agent session, native access through MCP, skills that say where to look',
    summary:
      'Slack\'s Events API posts signed webhooks straight to the on-prem proxy. One OpenCode session — Hogbot — owns each investigation, with worker subagents only when parallelism pays. MCP servers give it the data systems natively.',
    changed: [
      'Cloud DB and polling removed; Slack webhooks arrive through the edge with request signing.',
      'The proxy uses Vercel\'s Slack SDK: verify, reply, and run the human-in-the-loop exchange.',
      'Planner + mandatory subagents replaced by a single session with optional workers.',
      'MCP servers for Loki, Prometheus, databases and the Parquet lake; a nightly-synced repo mirror; a first set of hand-written skills.',
    ],
    pain: [
      'Still only as good as the skills someone had time to write; new question types started from scratch.',
      'No systematic way to know when a change made answers worse.',
    ],
    nodes: [
      n.traders(248),
      n.slack(248),
      {
        id: 'proxy',
        label: 'Webhook proxy',
        sub: 'Vercel Slack SDK · signed events · HITL',
        kind: 'proxy',
        x: 420,
        y: 248,
        w: NW + 30,
        h: NH + 6,
        changed: true,
        tip: 'Now receives Slack webhooks directly. Verifies signatures, acknowledges within Slack\'s 3-second window, streams replies, and relays clarifying questions and permission prompts back to the thread.',
      },
      {
        id: 'skills',
        label: 'Skills',
        sub: 'where to look, in what order',
        kind: 'skills',
        x: 420,
        y: 96,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'Hand-written playbooks: for a queue-priority question, replay the book from Parquet, then check quoting metrics, then read the strategy config.',
      },
      {
        id: 'hogbot',
        label: 'Hogbot · OpenCode',
        sub: 'one session per investigation',
        kind: 'agent',
        x: 652,
        y: 186,
        w: NW + 30,
        h: NH + 20,
        changed: true,
        tip: 'The agent defined in OpenCode. One long-lived session holds the whole investigation, so nothing is lost in hand-offs. Reads the screenshot, picks a skill, calls MCP tools, asks back when unsure.',
      },
      {
        id: 'workers',
        label: 'Worker subagents',
        sub: 'optional · parallel leads',
        kind: 'agent',
        x: 652,
        y: 340,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'Available, not mandatory. Hogbot spins them up for independent leads (e.g. scan three services\' logs at once) and keeps the synthesis itself.',
      },
      n.loki(858, 48),
      n.prom(858, 140),
      n.db(858, 232),
      n.parquet(858, 324),
      n.repos(858, 426),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'proxy', label: 'webhook' },
      { from: 'proxy', to: 'hogbot' },
      { from: 'skills', to: 'hogbot', dashed: true },
      { from: 'hogbot', to: 'workers', dashed: true },
      { from: 'hogbot', to: 'loki', label: 'MCP' },
      { from: 'hogbot', to: 'prom' },
      { from: 'hogbot', to: 'db' },
      { from: 'hogbot', to: 'parquet' },
      { from: 'hogbot', to: 'repos' },
      { from: 'proxy', to: 'slack', label: 'clarify · permission · answer', dashed: true, back: true },
    ],
  },
  {
    id: 3,
    name: 'The learning loop',
    tagline: 'The agent maintains its own skills; evals catch it when it drifts',
    summary:
      'Hogbot continuously updates 40–50 skills — content and scripts — and checks them into GitLab for review and for the team. LangSmith traces every run; a nightly evaluation replays known questions against known answers. A scheduler turns one-off investigations into recurring reports.',
    changed: [
      'Skills moved from static files to a GitLab repository the agent writes to and the team reviews.',
      'LangSmith tracing on every investigation; nightly regression evals over a golden question set.',
      'Scheduler for recurring work: "run this script daily and DM me the results".',
    ],
    nodes: [
      n.traders(248),
      n.slack(248),
      {
        id: 'proxy',
        label: 'Webhook proxy',
        sub: 'Vercel Slack SDK · signed events · HITL',
        kind: 'proxy',
        x: 420,
        y: 248,
        w: NW + 30,
        h: NH + 6,
        tip: 'Unchanged from v2: receives Slack webhooks, verifies, replies, relays questions and permission prompts.',
      },
      {
        id: 'skillsrepo',
        label: 'Skills repo · GitLab',
        sub: '40–50 skills · agent-maintained · reviewed',
        kind: 'skills',
        x: 420,
        y: 78,
        w: NW + 30,
        h: NH + 6,
        changed: true,
        tip: 'The agent edits skill content and scripts as it learns, commits to GitLab, and the team reviews. Version control gives rollback; sharing gives everyone the same playbooks.',
      },
      {
        id: 'hogbot',
        label: 'Hogbot · OpenCode',
        sub: 'one session per investigation',
        kind: 'agent',
        x: 652,
        y: 186,
        w: NW + 30,
        h: NH + 20,
        tip: 'Same monolith as v2, now reading skills from the repo and writing improvements back after each investigation.',
      },
      {
        id: 'workers',
        label: 'Worker subagents',
        sub: 'optional · parallel leads',
        kind: 'agent',
        x: 652,
        y: 340,
        w: NW + 30,
        h: NH,
        tip: 'Optional parallel workers, as in v2.',
      },
      {
        id: 'langsmith',
        label: 'LangSmith',
        sub: 'tracing · nightly evals',
        kind: 'ops',
        x: 420,
        y: 420,
        w: NW + 30,
        h: NH + 6,
        changed: true,
        tip: 'Every run is traced. A nightly job replays a curated set of questions with known answers and flags regressions before traders see them.',
      },
      {
        id: 'scheduler',
        label: 'Scheduler',
        sub: 'recurring reports → DM',
        kind: 'ops',
        x: 652,
        y: 446,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'Traders turn a refined one-off script into a scheduled job; results arrive as a Slack DM.',
      },
      n.loki(858, 48),
      n.prom(858, 140),
      n.db(858, 232),
      n.parquet(858, 324),
      n.repos(858, 426),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'proxy', label: 'webhook' },
      { from: 'proxy', to: 'hogbot' },
      { from: 'skillsrepo', to: 'hogbot', label: 'loads' },
      { from: 'hogbot', to: 'skillsrepo', label: 'commits', dashed: true, back: true },
      { from: 'hogbot', to: 'workers', dashed: true },
      { from: 'hogbot', to: 'loki', label: 'MCP' },
      { from: 'hogbot', to: 'prom' },
      { from: 'hogbot', to: 'db' },
      { from: 'hogbot', to: 'parquet' },
      { from: 'hogbot', to: 'repos' },
      { from: 'hogbot', to: 'langsmith', label: 'traces', dashed: true },
      { from: 'langsmith', to: 'skillsrepo', label: 'regressions', dashed: true, back: true },
      { from: 'scheduler', to: 'hogbot', dashed: true },
      { from: 'proxy', to: 'slack', label: 'clarify · permission · answer', dashed: true, back: true },
    ],
  },
];

export function findArchNode(iteration: 1 | 2 | 3, ref: string): ArchNode | null {
  const it = ARCHITECTURE.find((a) => a.id === iteration);
  if (!it) return null;
  const t = ref.trim().toLowerCase();
  return (
    it.nodes.find((x) => x.id === t) ??
    it.nodes.find((x) => x.label.toLowerCase() === t) ??
    it.nodes.find((x) => x.label.toLowerCase().includes(t) || t.includes(x.id)) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface Metric {
  id: string;
  label: string;
  unit?: string;
  /** One value per architecture iteration (v1, v2, v3). */
  byIteration: [number, number, number];
  /** Human baseline, if there is one worth showing. */
  baseline?: string;
  /** Lower is better (speed, cost, length). */
  lowerIsBetter?: boolean;
  /** Presenter estimate rather than an instrumented measurement. */
  estimate?: boolean;
  note: string;
}

export const METRICS: Metric[] = [
  {
    id: 'correctness',
    label: 'Right answer, first time',
    unit: '%',
    byIteration: [33, 65, 90],
    note: 'Share of tagged questions where the first answer surfaced the actual cause. v1 was one in three at best; v3 is nine in ten, checked by the nightly evals and thread reactions.',
  },
  {
    id: 'speed',
    label: 'Median time to a usable answer',
    unit: 'min',
    byIteration: [22, 9, 5],
    baseline: 'Human path: 2 hours to next day',
    lowerIsBetter: true,
    estimate: true,
    note: 'v1 waited on polling and multi-session hand-offs; v3 starts within seconds of the tag and usually answers in a few minutes.',
  },
  {
    id: 'cost',
    label: 'Cost per investigation',
    unit: '×',
    byIteration: [1, 0.5, 0.35],
    lowerIsBetter: true,
    estimate: true,
    note: 'Relative to v1. Mandatory subagent fan-out burned tokens on summaries that were thrown away; a single session with skills that go straight to the right source is cheaper per answer.',
  },
  {
    id: 'brevity',
    label: 'Median answer length',
    unit: 'words',
    byIteration: [520, 310, 160],
    lowerIsBetter: true,
    estimate: true,
    note: 'Traders read answers on a phone between trades. Skills carry answer templates; detail is one follow-up away.',
  },
  {
    id: 'skills',
    label: 'Skills in the library',
    byIteration: [0, 12, 45],
    note: 'v1 had none; v2 shipped with a dozen hand-written playbooks; v3 maintains 40–50, written and revised by the agent and reviewed by the team.',
  },
];

/** Weekly Hogbot mentions, oldest first — adoption curve for the sparkline (presenter estimate). */
export const ADOPTION_WEEKLY = [2, 3, 5, 4, 8, 11, 14, 19, 23, 28, 31, 36, 40, 44];

export const QUESTION_CLASSES = [
  'What is this parameter set to right now?',
  'Where were our quoters on this sequence?',
  'What was our queue priority on this trade?',
  'How much faster did we need to be to beat that fill?',
  'Has this algo been trading too aggressively, and why?',
  'Schedule this script daily and DM me the results.',
];

/** Everything the agent should know about Hogbot beyond the slides. */
export const HOGBOT_FACTS = [
  'Hogbot is a Slack ↔ OpenCode AI assistant built at Edgehog, a proprietary trading firm, for quants, traders and developers. Matt designed and built it.',
  'The data sources: Loki (logs), Prometheus (metrics), relational databases (orders, fills, params, configs), a Parquet lake (market and trade history), and ~300 git repositories, many deployed several times with different configs.',
  'Slack is in the cloud; all data and services are behind a VPN. v1 bridged this with a cloud database that an on-prem proxy polled. v2 and v3 use Slack webhooks delivered to the on-prem webhook proxy, which uses Vercel\'s Slack SDK.',
  'The screenshot problem: a trader\'s image can show 3–30 trades and the question says almost nothing; identifying the trade they mean was the hardest part and improved with skills that encode what "interesting" looks like for each question type.',
  'OpenCode is preloaded with every repo (clone on startup, fetch and pull nightly). MCP servers give Hogbot native access to Loki, Prometheus and the databases. Skills guide where to look. Human-in-the-loop prompts go back to Slack when the agent needs more information or permission to act.',
  'v1 was a planner with a fleet of mandatory subagents; context was not passed between sessions well enough and correctness was about one in three. v2/v3 are a monolith with optional worker subagents.',
  'v3 adds a continuous learning loop: the agent updates content and scripts across 40–50 skills, checked into GitLab for version control and shared with the team. LangSmith provides tracing and evals; a nightly run of common questions with known answers guards against regressions.',
  'Today Hogbot surfaces the right answer about 9 times in 10; it is tagged every day; traders ask it to do work a quant or developer would have done, including scheduling recurring reports delivered by DM.',
];
