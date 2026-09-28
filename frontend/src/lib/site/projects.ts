export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  url?: string;
  links?: { label: string; url: string }[];
  status: 'live' | 'building' | 'demo';
  /** Hue on the ambient field's palette wheel when this card is hovered. */
  hue: number;
  /** Prompt handed to the agent when the card's action is "ask". */
  ask?: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'telekinetik',
    title: 'Telekinetik',
    tagline: 'An open marketplace where agents find work, get paid, and compound knowledge.',
    description:
      'Runs as an MCP server: task posters set bounties, agents commit collateral, peers review, settlement is automatic. 22 tools, protocol v0.2, and a pitch deck for the curious.',
    url: 'https://www.telekinetik.ai/',
    links: [
      { label: 'Marketplace', url: 'https://www.telekinetik.ai/' },
      { label: 'Pitch', url: 'https://pitch.telekinetik.ai/' },
    ],
    status: 'building',
    hue: 0.62,
    ask: 'What is Telekinetik and how does the agent marketplace settle work?',
  },
  {
    slug: 'agentless',
    title: 'Agentless',
    tagline: 'A concierge-grade self-guided touring platform for Class A residential.',
    description:
      'A digital concierge (not a chatbot) that schedules tours, verifies ID, issues time-boxed access, and narrates the walkthrough — 24/7, white-labelled, on open standards.',
    url: 'https://agentless-web.vercel.app/',
    status: 'live',
    hue: 0.42,
    ask: 'Tell me about Agentless and who it is built for.',
  },
  {
    slug: 'blox-office',
    title: 'The Blox Office',
    tagline: 'Chicago ticketing for art, boutique electronic music, and community events.',
    description:
      'Founded 2018 and bootstrapped past $3M gross volume: 2k events across 4 states and 3 countries, 35k users, 70k tickets issued.',
    url: 'https://thebloxoffice.io/',
    status: 'live',
    hue: 0.86,
    ask: 'What is The Blox Office?',
  },
  {
    slug: 'poster-parser',
    title: 'Poster → Event',
    tagline: 'Drop a flyer, get structured event JSON. Vision to form-fill, in this chat.',
    description:
      'Clients used to text me a poster and ask me to build their event. The whole spec is on the flyer — so the agent reads it: name, date, lineup, venue, price, links — validated against a schema and ready to submit.',
    status: 'demo',
    hue: 0.1,
    ask: 'I want to turn a poster into an event. What do you need from me?',
  },
  {
    slug: 'cemc',
    title: 'CEMC',
    tagline: 'Chicago Electronic Music Conference.',
    description:
      'A passion project with two friends: a premier event for local artists and businesses to showcase the best of the city and beyond.',
    url: 'https://chicagoemc.com',
    status: 'live',
    hue: 0.75,
  },
];
