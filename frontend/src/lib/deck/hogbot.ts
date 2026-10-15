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
      'Hogbot is a Slack-native AI assistant I built at Edgehog, a proprietary trading firm. Traders tag it the way they used to tag a quant, and it goes and finds the answer.',
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
      'The deeper problem is inconsistency in where information lives. There is no single table of all orders: each strategy keeps its orders in whatever schema its developer put in place. Two databases matter most — TimescaleDB (public and private trades, vol data, product reference data such as MDP symbol, instrument name, strike, maturity, expiration, type, product, exchange) and the drop-copy database (every iLink message to and from the exchange). There are two Parquet lakes, an older MBP one and a newer full-depth MBO one rebuilt from pcaps. Loki logs sometimes hold the answer (some apps print five levels of MBO on a fill). Deployment configs live in GitLab CI, Dockerfiles, compose files and the odd TOML; parameters live in per-product TOML files or a params schema in the database. And there are ~300 repositories, many deployed several times with different configs.',
      'Only two or three people at the company knew where to look and how to investigate. When the first source didn\'t explain what the trader saw, investigations stalled at dead ends. Queue-priority questions were the worst: the only tool that could replay the book from pcaps took hours, ran on one box over SSH, and was a command-line tool nobody but engineers used — so a frequent question went mostly unanswered.',
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
      'Hogbot is an agent defined in OpenCode and reached through Slack. Slack is the interface; OpenCode is the brain; MCP servers and a library of skills are the hands.',
      'Flow: a trader tags Hogbot with a screenshot and a few words. Hogbot reads the screenshot and identifies the trade the trader means — the instrument, the quantity, the edge, and critically the time, which is what bounds every lookup and query that follows. It picks a skill: a playbook with a deterministic script for that kind of question. It runs the script, and only when the script falls short does it explore live data through the MCP servers (TimescaleDB, drop-copy DB, the Parquet lakes, Loki, Prometheus) and the local mirror of all ~300 repos.',
      'When it needs more information to start, or permission to take an action, it asks back in the Slack thread, and it posts progress updates as it works so traders can see what it is doing without leaving the thread. The same human-in-the-loop path approves eval examples: a lesson learned becomes a regression test with a known answer. Then it answers in the thread, briefly.',
      'Three principles: no change to the trader\'s workflow; scripts first and exploration second, so answers are fast and repeatable; a human in the loop for ambiguity and for actions.',
      'Screenshot reading was the hardest piece in the first version — models misidentified the trade of interest and misread instrument names, quantities and edge. Better models plus skills that explain what the model is looking at, and how to infer what a trader implies, made that a non-issue.',
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    kicker: '03 · Three iterations',
    minutes: 6,
    aliases: ['architecture', 'diagram', 'design', 'system', 'iterations', 'evolution'],
    notes: [
      'v1 — Poll the cloud, script every question. Slack lives in the cloud; everything else sits behind a VPN. The Slack app wrote events to a new cloud database; an on-prem proxy polled it and called OpenCode. The agent was a planner with a fleet of mandatory subagents, and the "skills" were hand-written monolith scripts, one per known question.',
      'v1 failed three ways. Polling added latency and a whole extra system. The planner/subagent split lost context between sessions. And the scripts were untenable: every new wrinkle (the real cause was another service being down; ICE and CME data shaped differently; a question nobody had scripted) meant I was hand-editing scripts and could not keep up. Right answer about one time in three.',
      'v2 — Socket Mode, a monolith, and guides. The Slack app switched to Socket Mode: an outbound websocket from the on-prem proxy, so no inbound ingress and no cloud database. The proxy runs on Vercel\'s Chat SDK with the Slack adapter; we still render some Block Kit ourselves, but OpenCode\'s responses stopped breaking and the thread shows progress and step updates. The agent became one session — "Hogbot" — with optional worker subagents on cheaper models. Skills became guides and docs, and the agent fetched data itself through new MCP servers: the drop-copy database, scheduled pcap-parser jobs with caching for queue-priority questions, alongside Loki, Prometheus, TimescaleDB and the Parquet lake.',
      'v2\'s problem was non-determinism: with the agent exploring freely, important details got missed because not every guide fits in context at once. Answers were still verbose and slow.',
      'v3 — Scripts first, explore second, and learn. Skills carry deterministic scripts again, but now the agent uses MCP to course-correct when a script fails or a trader flags a miss, and then refines the script. The skills live in a GitLab repo the agent writes to and the team reviews: 40–50 of them. LangSmith traces every run and a nightly evaluation replays known questions. The pcap work grew into a full-depth MBO Parquet lake — all incoming MDP across the channels we trade plus all iLink session data — which answers a vast range of algo-activity questions nobody could answer before. A scheduler turns refined scripts into recurring reports.',
      'Two cross-cutting changes made v3 fast: a system prompt tuned for brevity with an explicit max-steps budget in the agent definition, so a capable model cannot spin for ten or twenty minutes; and model selection — state-of-the-art models by default, with a few subagents on smaller models like Haiku for simple tasks. Answers now land in seconds, a minute or two at most, and the gains hold without frontier models.',
    ],
  },
  {
    id: 'tradeoffs',
    title: 'Tradeoffs',
    kicker: '04 · What we chose, and what it cost',
    minutes: 3,
    aliases: ['tradeoffs', 'trade-offs', 'risks', 'limitations', 'decisions', 'alternatives'],
    notes: [
      'Socket Mode over polling or inbound webhooks: an outbound websocket means no ingress into the on-prem network and no cloud database, with second-level latency. Slack positions Socket Mode as a development feature; for us it was simply the better fit, at the cost of a long-lived connection to keep healthy.',
      'One agent session with optional subagents over a planner with mandatory subagents: context stays in one place, and the main agent — always a state-of-the-art model — does most of the work itself; a few subagents run smaller models like Haiku for simple tasks. The cost is longer single contexts and parallelism only when it pays.',
      'Deterministic scripts in skills, with MCP to course-correct, over either hand-written scripts (v1) or free exploration with guides (v2): fast, repeatable lookups plus the ability to investigate something new. The cost is a skills library that needs review and evals, because the agent can learn the wrong lesson.',
      'A local repo mirror over vector or graph RAG: full repo access was immediately usable for questions about interrelated algos, services and configs, while RAG and GraphRAG took too long to show results. The cost is disk, a nightly sync, and trusting the agent to navigate 300 repos.',
      'Brevity and a max-steps budget over open-ended reasoning: traders read the answer in the Slack desktop app between trades and will not wait ten minutes; reading it on a phone out of the office is a side benefit. Detail is one follow-up away.',
      'Human in the loop over full autonomy: ambiguous asks and actions get a question back in the thread, and the same mechanism approves eval examples — when a lesson is learned, it is one click to add it as a regression test with a known answer. The cost is a slower turnaround on those asks.',
      'Limitations to be honest about: where no script exists yet the agent is non-deterministic, so nightly evals matter more than unit tests; the agent can learn the wrong lesson, so skills need review; cost scales with usage; coverage is bounded by which systems have an MCP server and what the lakes contain.',
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
      'Speed: the human path was minutes to next-day depending on who was free; v1 and v2 answers were verbose and slow; v3 answers often land in seconds, a minute or two at most.',
      'Adoption: traders tag Hogbot every day and ask it to do the work a quant or developer would have done — "what is this parameter set to", "do we have a param that could tune this scenario", "was system X running", "how much faster did we need to be", "has this algo been trading too aggressively, and why", "schedule a daily report running this script and DM me the results".',
      'Capability grows with the skills library: 40–50 skills today, maintained by the agent itself and reviewed by the team; and with the data engineering it motivated — the pcap-backed Parquet lake answers queue-priority and quote-age questions nobody at the firm could answer in reasonable time before.',
      'Latency is measured in LangSmith. Over 15 July – 15 October 2026, trace latency P50 fell from roughly 150–250 seconds to about 50 seconds and P99 from 500–1,000 seconds (with spikes past 1,400) to 100–200 seconds; LLM call latency P99 fell from 200–250 seconds to 40–60 seconds and P50 from about 15 to 5 seconds. The step change in early September is the scripts-first release.',
    ],
  },
  {
    id: 'close',
    title: 'Lessons & questions',
    kicker: '06 · What I would tell my past self',
    minutes: 1,
    aliases: ['close', 'closing', 'lessons', 'questions', 'q&a', 'end', 'last slide', 'summary'],
    notes: [
      'Three lessons: put the agent where the people already are; scripts first, exploration second — determinism is what made it fast and trustworthy; and measure correctness every night, because a system that learns can learn the wrong thing quietly.',
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
  /** Drawn faded: exists but the agent could not reach it. */
  unreachable?: boolean;
  /** Optional screenshot shown in the tooltip (served from /api/presentation/asset). */
  image?: { src: string; alt: string };
}

/** Real screenshots used as examples in the deck (gated like the deck itself). */
export const DECK_IMAGES = {
  slackThread: {
    src: 'slack-thread.png',
    alt: 'A real thread: a trader posts a screenshot of the trade log, asks "did normal taker shoot", and Hogbot shows each step it takes before answering in-thread.',
  },
  traceLatency: {
    src: 'trace-latency.png',
    alt: 'LangSmith trace latency, Jul 15 – Oct 15 2026: P50 fell from roughly 150–250 s to about 50 s; P99 from 500–1,000 s to 100–200 s.',
  },
  llmLatency: {
    src: 'llm-latency.png',
    alt: 'LangSmith LLM call latency, Jul 15 – Oct 15 2026: P99 fell from roughly 200–250 s to 40–60 s; P50 from about 15 s to 5 s.',
  },
} as const;

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
const DX = 858;

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
  slack: (y: number, sub = 'cloud workspace'): ArchNode => ({
    id: 'slack',
    label: 'Slack',
    sub,
    kind: 'cloud',
    x: 178,
    y,
    w: NW,
    h: NH,
    tip: 'Slack is SaaS, outside the company network — and the Slack desktop app is where traders live all day (the phone is for out-of-office). Every design has to bridge from here to data that never leaves the VPN.',
  }),
  loki: (y: number): ArchNode => ({ id: 'loki', label: 'Loki', sub: 'logs', kind: 'data', x: DX, y, w: DW, h: DH, tip: 'Grafana Loki holds the trading systems\' logs. Some apps print five levels of MBO on a fill, so it can sometimes answer queue-priority questions — and often cannot.' }),
  prom: (y: number): ArchNode => ({ id: 'prom', label: 'Prometheus', sub: 'metrics', kind: 'data', x: DX, y, w: DW, h: DH, tip: 'Latency, queue and quoting metrics. Answers "how much faster did we need to be" questions. Present from v1.' }),
  timescale: (y: number): ArchNode => ({ id: 'timescale', label: 'TimescaleDB', sub: 'trades · vol · reference', kind: 'data', x: DX, y, w: DW, h: DH, tip: 'The main database: public and private trades, vol data, product reference data (MDP symbol, instrument, strike, maturity, expiration, type, product, exchange), a params schema — and each strategy\'s own order tables, wherever its developer put them.' }),
  dropcopy: (y: number): ArchNode => ({ id: 'dropcopy', label: 'Drop-copy DB', sub: 'every iLink message', kind: 'data', x: DX, y, w: DW, h: DH, tip: 'All iLink messages to and from the exchange. Got its own MCP server in v2.' }),
  parquet: (y: number, sub = 'MBP history'): ArchNode => ({ id: 'parquet', label: 'Parquet lake', sub, kind: 'data', x: DX, y, w: DW, h: DH, tip: 'The original lake: market-by-price history. Good for what happened, thin on queue position.' }),
  repos: (y: number): ArchNode => ({ id: 'repos', label: 'Repo mirror', sub: '~300 repos · nightly pull', kind: 'repo', x: DX, y, w: DW, h: DH, tip: 'All repositories cloned on startup and fetched nightly, plus their GitLab CI, Dockerfiles, compose and TOML. Full local access beat vector and graph RAG immediately for questions about interrelated algos and services.' }),
};

export const ARCHITECTURE: ArchIteration[] = [
  {
    id: 1,
    name: 'Poll the cloud',
    tagline: 'A planner, a fleet of subagents, a script per question, and a database in the middle',
    summary:
      'The Slack app wrote events to a new cloud database. An on-prem proxy polled it and handed each request to an OpenCode planner, which split the work across subagents and ran hand-written scripts, one per known question.',
    changed: [],
    pain: [
      'Polling added latency and a whole extra system to run.',
      'Context was lost between the planner and its subagent sessions.',
      'One script per question could not keep up: a service being down, ICE vs CME data shapes, any new question meant hand-editing scripts.',
      'Queue-priority questions needed the pcap parser: hours, one box, SSH, a CLI. Out of reach.',
      'Right answer about one time in three; answers verbose and slow.',
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
        x: 440,
        y: 374,
        w: NW + 10,
        h: NH,
        tip: 'A small on-prem service that polled the cloud DB, called OpenCode, and posted results back to Slack.',
      },
      {
        id: 'scripts',
        label: 'Question scripts',
        sub: 'hand-written · one per question',
        kind: 'skills',
        x: 440,
        y: 96,
        w: NW + 10,
        h: NH,
        tip: 'Monolith scripts written by hand for each known question. Every new wrinkle — another service down, ICE vs CME shapes, a question nobody had scripted — meant editing them. I could not keep up.',
      },
      {
        id: 'planner',
        label: 'OpenCode · planner',
        sub: 'decomposes the ask',
        kind: 'agent',
        x: 652,
        y: 150,
        w: NW + 20,
        h: NH,
        tip: 'The first agent design: a planner that broke each question into leads and dispatched them.',
      },
      {
        id: 'subagents',
        label: 'Subagent fleet',
        sub: 'mandatory · one session per lead',
        kind: 'agent',
        x: 652,
        y: 290,
        w: NW + 20,
        h: NH,
        tip: 'Mandatory subagents, each in its own session. They did the digging but handed back summaries that dropped the detail the planner needed.',
      },
      {
        id: 'pcapcli',
        label: 'pcap parser · CLI',
        sub: 'hours · one box · SSH',
        kind: 'ops',
        x: 652,
        y: 440,
        w: NW + 20,
        h: NH,
        unreachable: true,
        tip: 'The only tool that could rebuild the order book from packet captures. Hours per run, on one box, over SSH, command-line only. Traders asked queue-priority questions constantly; almost nobody could answer them.',
      },
      n.loki(40),
      n.prom(130),
      n.timescale(220),
      n.parquet(310),
      n.repos(400),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'slackapp' },
      { from: 'slackapp', to: 'clouddb' },
      { from: 'clouddb', to: 'proxy', label: 'poll', dashed: true },
      { from: 'proxy', to: 'planner' },
      { from: 'scripts', to: 'planner', dashed: true },
      { from: 'planner', to: 'subagents' },
      { from: 'subagents', to: 'loki' },
      { from: 'subagents', to: 'prom' },
      { from: 'subagents', to: 'timescale' },
      { from: 'subagents', to: 'parquet' },
      { from: 'subagents', to: 'repos' },
      { from: 'subagents', to: 'planner', label: 'summaries', dashed: true, back: true },
      { from: 'proxy', to: 'slack', label: 'answer', dashed: true, back: true },
    ],
  },
  {
    id: 2,
    name: 'Socket Mode and a monolith',
    tagline: 'One agent session, guides instead of scripts, native access through MCP',
    summary:
      'The Slack app switched to Socket Mode: an outbound websocket from the on-prem proxy, so no inbound ingress and no cloud database. The proxy runs on Vercel\'s Chat SDK with the Slack adapter. One OpenCode session — Hogbot — owns each investigation, skills became guides, and new MCP servers opened up the drop-copy DB and scheduled pcap jobs.',
    changed: [
      'Cloud DB and polling removed; Slack Socket Mode (outbound websocket) into the on-prem proxy.',
      'Proxy on Vercel\'s Chat SDK + Slack adapter: fewer Block Kit rendering errors, progress and step updates in the thread.',
      'Planner + mandatory subagents replaced by a single session on a state-of-the-art model that does most of the work itself; optional subagents, some on smaller models like Haiku for simple tasks.',
      'Skills as guides and docs; the agent fetches data itself over MCP.',
      'A new MCP server for the drop-copy DB; scheduled pcap-parser jobs with caching, taught to Hogbot through a skill, for queue-priority questions.',
    ],
    pain: [
      'Too non-deterministic: free exploration missed details because not every guide fits in context at once.',
      'Still verbose, still slow; no systematic way to catch regressions.',
    ],
    nodes: [
      n.traders(248),
      n.slack(150),
      {
        id: 'slackapp',
        label: 'Slack app',
        sub: 'Socket Mode · outbound websocket',
        kind: 'cloud',
        x: 178,
        y: 262,
        w: NW,
        h: NH,
        changed: true,
        tip: 'The same Slack app as v1, now in Socket Mode: instead of sending webhooks it accepts a websocket that the on-prem proxy opens outbound. Slack positions Socket Mode as a development feature; for a VPN-bound backend it is the better fit — nothing has to listen on the public internet.',
      },
      {
        id: 'proxy',
        label: 'Slack proxy',
        sub: 'Chat SDK + Slack adapter · HITL · progress',
        kind: 'proxy',
        x: 420,
        y: 248,
        w: NW + 30,
        h: NH + 6,
        changed: true,
        image: DECK_IMAGES.slackThread,
        tip: 'Opens an outbound websocket to Slack (Socket Mode) — nothing comes in through the firewall. Built on Vercel\'s Chat SDK with the Slack adapter; renders OpenCode\'s output into Block Kit without the old breakage, streams progress and step updates into the thread, and relays clarifying questions and permission prompts.',
      },
      {
        id: 'skills',
        label: 'Skills · guides',
        sub: 'where to look, in what order',
        kind: 'skills',
        x: 420,
        y: 96,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'Scripts replaced by guides and docs: for a queue-priority question, replay the book, then check quoting metrics, then read the strategy params. The agent fetched the data itself.',
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
        tip: 'The agent defined in OpenCode. One long-lived session holds the whole investigation, so nothing is lost in hand-offs. Reads the screenshot, picks a guide, calls MCP tools, asks back when unsure.',
      },
      {
        id: 'workers',
        label: 'Worker subagents',
        sub: 'optional · some on smaller models',
        kind: 'agent',
        x: 652,
        y: 340,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'Available, not mandatory — typically the main agent does all the work. Everything defaults to state-of-the-art models; a few subagents are defined on smaller models such as Haiku for simple, well-bounded tasks.',
      },
      {
        id: 'pcapjobs',
        label: 'pcap jobs + cache',
        sub: 'scheduled · MCP',
        kind: 'ops',
        x: 652,
        y: 446,
        w: NW + 30,
        h: NH,
        changed: true,
        tip: 'The pcap parser, scheduled and cached instead of run by hand, with a skill that tells Hogbot how to use it. Hogbot was taught to use it for every quote and queue-priority question — the first time those were answerable on demand.',
      },
      n.loki(28),
      n.prom(106),
      n.timescale(184),
      n.dropcopy(262),
      n.parquet(340),
      n.repos(418),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'slackapp' },
      { from: 'slackapp', to: 'proxy', label: 'Socket Mode' },
      { from: 'proxy', to: 'hogbot' },
      { from: 'skills', to: 'hogbot', dashed: true },
      { from: 'hogbot', to: 'workers', dashed: true },
      { from: 'hogbot', to: 'pcapjobs', label: 'skill' },
      { from: 'hogbot', to: 'loki', label: 'MCP' },
      { from: 'hogbot', to: 'prom' },
      { from: 'hogbot', to: 'timescale' },
      { from: 'hogbot', to: 'dropcopy' },
      { from: 'hogbot', to: 'parquet' },
      { from: 'hogbot', to: 'repos' },
      { from: 'hogbot', to: 'proxy', label: 'progress', dashed: true, back: true },
      { from: 'proxy', to: 'slackapp', label: 'replies', dashed: true, back: true },
    ],
  },
  {
    id: 3,
    name: 'Scripts first, then learn',
    tagline: 'Deterministic scripts in skills, MCP to course-correct, evals to keep it honest',
    summary:
      'Skills carry deterministic scripts again, and the agent uses MCP to explore when a script falls short — then refines the script and commits it to GitLab for review. LangSmith traces every run and a nightly eval replays known questions. The pcap work grew into a full-depth MBO Parquet lake, and a scheduler turns refined scripts into recurring reports.',
    changed: [
      'Skills = scripts + guidance, 40–50 of them, in a GitLab repo the agent writes to and the team reviews.',
      'Failure path: when a script misses, explore over MCP, then fix the script — the learning loop.',
      'LangSmith tracing on every investigation; nightly regression evals over a golden question set.',
      'Brevity-tuned system prompt and an explicit max-steps budget; state-of-the-art models by default, smaller ones only for simple subagent tasks.',
      'Full-depth MBO Parquet lake rebuilt from pcaps (all incoming MDP across traded channels + all iLink session data), with its own skill and reference scripts using DuckDB.',
      'Scheduler for recurring work: "run this script daily and DM me the results".',
    ],
    nodes: [
      n.traders(248),
      n.slack(150),
      {
        id: 'slackapp',
        label: 'Slack app',
        sub: 'Socket Mode · outbound websocket',
        kind: 'cloud',
        x: 178,
        y: 262,
        w: NW,
        h: NH,
        tip: 'The same Slack app as v1, now in Socket Mode: instead of sending webhooks it accepts a websocket that the on-prem proxy opens outbound. Slack positions Socket Mode as a development feature; for a VPN-bound backend it is the better fit — nothing has to listen on the public internet.',
      },
      {
        id: 'proxy',
        label: 'Slack proxy',
        sub: 'Chat SDK + Slack adapter · HITL · progress',
        kind: 'proxy',
        x: 420,
        y: 248,
        w: NW + 30,
        h: NH + 6,
        image: DECK_IMAGES.slackThread,
        tip: 'Unchanged from v2: outbound Socket Mode websocket, Vercel Chat SDK with the Slack adapter, progress and step updates in the thread, questions and permission prompts relayed.',
      },
      {
        id: 'skillsrepo',
        label: 'Skills repo · GitLab',
        sub: '40–50 skills · scripts + guidance · reviewed',
        kind: 'skills',
        x: 420,
        y: 78,
        w: NW + 30,
        h: NH + 6,
        changed: true,
        tip: 'Each skill pairs a deterministic script with guidance on when it applies. The agent edits scripts as it learns, commits to GitLab, and the team reviews. Version control gives rollback; sharing gives everyone the same playbooks.',
      },
      {
        id: 'hogbot',
        label: 'Hogbot · OpenCode',
        sub: 'scripts first · explore on a miss',
        kind: 'agent',
        x: 652,
        y: 186,
        w: NW + 30,
        h: NH + 20,
        changed: true,
        image: DECK_IMAGES.llmLatency,
        tip: 'Same monolith as v2, now biased to run a skill\'s script first and only reach for MCP exploration when the script fails or a trader flags a miss. A brevity-tuned prompt and a max-steps budget keep answers to seconds, a minute or two at most.',
      },
      {
        id: 'workers',
        label: 'Worker subagents',
        sub: 'optional · some on smaller models',
        kind: 'agent',
        x: 652,
        y: 340,
        w: NW + 30,
        h: NH,
        tip: 'Optional subagents as in v2; the main agent on a state-of-the-art model still does most of the work itself.',
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
        image: DECK_IMAGES.traceLatency,
        tip: 'Every run is traced. A nightly job replays a curated set of questions with known answers and flags regressions before traders see them — the safety net that makes self-editing skills acceptable. New examples enter the set through the human-in-the-loop approval in Slack: a lesson learned is one approval away from being a regression test.',
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
        tip: 'Traders turn a refined script into a scheduled job; results arrive as a Slack DM.',
      },
      n.loki(28),
      n.prom(106),
      n.timescale(184),
      n.dropcopy(262),
      {
        ...n.parquet(340, 'MBP + full-depth MBO'),
        changed: true,
        tip: 'Two lakes now: the old MBP history and a new full-depth MBO lake I built from pcaps and maintain — all incoming MDP across every channel we trade plus all iLink session data. Reached through its own skill and reference scripts that query it with DuckDB. Answers queue-priority, quote-age and a vast range of algo-activity questions on demand.',
      },
      n.repos(418),
    ],
    edges: [
      { from: 'traders', to: 'slack' },
      { from: 'slack', to: 'slackapp' },
      { from: 'slackapp', to: 'proxy', label: 'Socket Mode' },
      { from: 'proxy', to: 'hogbot' },
      { from: 'skillsrepo', to: 'hogbot', label: 'scripts' },
      { from: 'hogbot', to: 'skillsrepo', label: 'refines', dashed: true, back: true },
      { from: 'hogbot', to: 'workers', dashed: true },
      { from: 'hogbot', to: 'loki', label: 'MCP' },
      { from: 'hogbot', to: 'prom' },
      { from: 'hogbot', to: 'timescale' },
      { from: 'hogbot', to: 'dropcopy' },
      { from: 'hogbot', to: 'parquet' },
      { from: 'hogbot', to: 'repos' },
      { from: 'hogbot', to: 'langsmith', label: 'traces', dashed: true },
      { from: 'langsmith', to: 'skillsrepo', label: 'regressions', dashed: true, back: true },
      { from: 'scheduler', to: 'hogbot', dashed: true },
      { from: 'hogbot', to: 'proxy', label: 'progress', dashed: true, back: true },
      { from: 'proxy', to: 'slackapp', label: 'replies', dashed: true, back: true },
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
  /** Optional display strings per iteration (overrides value + unit). */
  display?: [string, string, string];
  /** Human baseline, if there is one worth showing. */
  baseline?: string;
  /** Lower is better (speed, cost, length). */
  lowerIsBetter?: boolean;
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
    label: 'Time to a usable answer',
    unit: 'min',
    byIteration: [20, 8, 1],
    display: ['~20 min', '~8 min', 'seconds'],
    baseline: 'Human path: minutes to next day',
    lowerIsBetter: true,
    note: 'v1 waited on polling, multi-session hand-offs and long verbose reasoning; v3 runs a script first under a max-steps budget and usually answers in seconds, a minute or two at most.',
  },
  {
    id: 'cost',
    label: 'Cost per investigation',
    unit: '×',
    byIteration: [1, 0.5, 0.3],
    lowerIsBetter: true,
    note: 'Relative to v1. Mandatory subagent fan-out burned tokens on summaries that were thrown away; scripts that go straight to the right source, a step budget and smaller models for the simple subagent tasks make each answer cheaper.',
  },
  {
    id: 'brevity',
    label: 'Answer length',
    unit: 'words',
    byIteration: [820, 310, 150],
    lowerIsBetter: true,
    note: 'v1 and v2 were far too verbose. A brevity-tuned system prompt and answer templates in skills brought replies down to what a trader reads in a Slack thread between trades (and on a phone out of the office); detail is one follow-up away.',
  },
  {
    id: 'skills',
    label: 'Skills in the library',
    byIteration: [6, 12, 45],
    note: 'v1 had a handful of hand-written question scripts; v2 shipped a dozen guides; v3 maintains 40–50 script-backed skills, written and revised by the agent and reviewed by the team.',
  },
];

/** Weekly Hogbot mentions, oldest first — adoption curve for the sparkline. */
export const ADOPTION_WEEKLY = [2, 3, 5, 4, 8, 11, 14, 19, 23, 28, 31, 36, 40, 44];

export const QUESTION_CLASSES = [
  'What is this parameter set to? Do we have a param that could tune this scenario?',
  'Where were our quoters on this sequence? What was our queue priority?',
  'How much faster did we need to be to beat that fill?',
  'Was system X running? Why did this other service matter?',
  'Has this algo been trading too aggressively, and why?',
  'Schedule this script daily and DM me the results.',
];

/** Everything the agent should know about Hogbot beyond the slides. */
export const HOGBOT_FACTS = [
  'Hogbot is a Slack ↔ OpenCode AI assistant built at Edgehog, a proprietary trading firm, for quants, traders and developers. Matt designed and built it.',
  'Where data lives is inconsistent on purpose-by-accident: no single orders table — each strategy keeps orders in whatever schema its developer set up. The two most important databases are TimescaleDB (public and private trades, vol data, product reference data: MDP symbol, instrument name, strike, maturity, expiration, instrument type, product, exchange; plus a params schema) and the drop-copy DB (all iLink messages to and from the exchange). Both have MCP servers.',
  'Two Parquet lakes: an older one with MBP data, and a newer full-depth MBO lake Matt built from pcaps and maintains — all incoming MDP across every channel traded plus all iLink session data. It can always answer queue-priority and quote-age questions; Loki sometimes could, because some apps print five levels of MBO on a fill.',
  'The pcap story: an old pcap-parser app rebuilt the book from captures but took hours, ran on one box over SSH, and was a CLI — rarely used despite constant questions. Matt built scheduled pcap-parser jobs with caching, taught Hogbot to use them for all quote and queue-priority questions, and that data-engineering work grew into the comprehensive pcap-based Parquet lake. It was a separate endeavour, motivated by Hogbot (and everyone else) being unable to answer QP questions in reasonable time.',
  'Deployment configs live in GitLab CI, Dockerfiles, compose files and sometimes TOML. Params live in per-product-instance TOML files or a params schema in the database. ~300 repos, many deployed several times with different configs, are mirrored locally (clone on startup, fetch nightly). Local repo access beat vector/graph RAG immediately; RAG took too long to show results.',
  'Agent evolution: v1 hand-written monolith scripts per question (untenable: a service being down, ICE vs CME data shapes, new questions with no script — Matt could not keep up editing them) with a planner + mandatory subagent fleet. v2 skills as guides/docs with free data fetching over MCP (too non-deterministic; details missed because not all guides fit in context). v3 bias toward skills with deterministic scripts, using MCP to course-correct and evolve the scripts — fast optimised deterministic lookups plus generalised investigation.',
  'Latency came down from reusable scripts in skills instead of guided MCP tool calls, a system prompt tuned for brevity, and an explicit max-steps budget in the agent definition so capable models (Astra, Fable) cannot spin for 10–20 minutes. Current release: answers often in seconds, a minute or two max. v1/v2 were far too verbose and slow and often still wrong. Better models help, but the gains hold without frontier models.',
  'Measured in LangSmith (15 Jul – 15 Oct 2026): trace latency P50 fell from ~150–250 s to ~50 s and P99 from ~500–1,000 s (spikes to 1,400 s) to ~100–200 s; LLM call latency P99 fell from ~200–250 s to ~40–60 s and P50 from ~15 s to ~5 s. The sharp drop in early September coincides with the scripts-first release (v3). Both charts are on the results slide and in the architecture tooltips for the Hogbot and LangSmith nodes.',
  'A real example (on the solution slide and the proxy tooltip): a trader posts a screenshot of the trade log and asks "did normal taker shoot". Hogbot shows its steps in the thread — resolve instrument, timescale-db SQL, Loki logs, drop-copy SQL, more timescale and drop-copy queries, then a Grafana deeplink — and answers: normal Taker filled 11 @ −0.90 on HE Feb76/Nov65 at 12:33:39.648 CT just before the visible prints; a later normal-Taker reload was blocked by GLOBAL_INSTRUMENT_LOCK despite sufficient edge; SL separately filled 4 @ −0.90 at 12:33:40.462, with links to the Taker logs and drop copy and the session id.',
  'Model selection matters. Hogbot defaults to state-of-the-art models everywhere; the main agent typically does all the work itself. Some subagents are defined with smaller models such as Haiku for simple tasks. Better models help, but the v3 gains do not depend on being on frontier models.',
  'Slack connectivity: v1 used a cloud DB that an on-prem proxy polled. v2 and v3 use Slack Socket Mode — the Slack app connects over an outbound websocket (Slack positions it as a sandbox-ish feature, but it was the better option: no inbound ingress). The proxy uses Vercel\'s Chat SDK with the Slack adapter; some Block Kit elements are still handled by hand, abstracted enough to stop rendering errors from OpenCode\'s response text, with refined progress and step updates in the thread so traders can see what Hogbot is doing without leaving it. There are no inbound webhooks.',
  'MCP coverage expanded over time: Loki, Prometheus (v1 onward), TimescaleDB, the drop-copy DB MCP (v2 and up). The pcap-backed MBO Parquet lake is reached through its own skill and reference scripts that query it with DuckDB, not an MCP server.',
  'The screenshot carries the time as well as the trade: timestamps are the critical element for lookups and bounded queries — every script and MCP query is scoped to the window the screenshot shows.',
  'Screenshot reading was a v1-era weakness (misidentifying the trade of interest, misreading instrument names, quantities, edge). It is no longer an issue: better models plus skills that explain what the model is looking at and how to identify what a trader implies.',
  'Human in the loop serves three purposes: asking for missing detail, asking permission before an action, and approving eval examples — a lesson learned is simple to add as a regression/eval test example with a known answer.',
  'v3 adds the learning loop: the agent updates content and scripts across 40–50 skills, checked into GitLab for version control and shared with the team. LangSmith provides tracing and evals; a nightly run of common questions with known answers guards against regressions. Hogbot surfaces the right answer about 9 times in 10 (v1 about 1 in 3), is tagged every day, and is asked to do work a quant or developer would have done, including scheduling recurring reports delivered by DM.',
];
