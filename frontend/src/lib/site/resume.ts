/**
 * Structured résumé. Single source of truth for the /resume page, the agent's
 * `getResume` tool, and the MCP App widget. Mirrors the September 2026 PDF.
 */

export interface ResumeRole {
  title: string;
  org: string;
  start: string;
  end: string;
  bullets: string[];
  stack?: string[];
}

export interface Resume {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  summary: string;
  highlights: { title: string; detail: string }[];
  experience: ResumeRole[];
  education: { degree: string; school: string; start: string; end: string; notes: string[] }[];
  skills: string[];
  interests: string[];
  pdfUrl: string;
  updated: string;
}

export const RESUME: Resume = {
  name: 'Matthew A Pest',
  headline: 'Principal AI & Data Architect · Full Stack Engineer',
  location: 'Chicago, IL',
  email: 'matt.pest@gmail.com',
  phone: '+1 (914) 602-3319',
  website: 'https://www.mattpest.com',
  updated: '2026-09',
  pdfUrl:
    'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/matthew-pest-resume-2026-09.pdf',
  summary:
    'Principal architect at a CME-focused Chicago prop firm — currently porting our most complex trading algo from Java to C++ and running its research and parameter-tuning pipeline end to end. I built the firm’s most precise source of truth for market data and algo activity (pcap into Parquet/Iceberg: full-depth MBO plus timeseries for every MDP3 and iLink message template on our channels/sessions), took the entire 30-person team to agentic development, and ran a firm-wide clearing firm migration in 3 days with zero downtime. First year alongside the transformation: +120% YoY PnL, +200% production deployment velocity, and roughly $1.75m/year in identified cost eliminations.',
  highlights: [
    {
      title: 'Porting the firm’s most complex trading algo from Java to C++',
      detail:
        'Sole owner of the research and parameter-tuning pipeline (LightGBM feature exploration, linear regression with a second pass over residuals), backed by my pcap lake and the full algo stack.',
    },
    {
      title: 'Discovered and fixed defects in shared libraries handling core iLink flows',
      detail: 'Bugs the firm had written off as too risky to touch.',
    },
    {
      title: 'CME pcap data lake (MDP3 + iLink into Parquet/Iceberg)',
      detail:
        'Enables queue-position ground truth, ML feature generation, and in-house trade surveillance — avoided an estimated $1m per annum in compliance-mandated surveillance costs via build vs buy.',
    },
    {
      title: 'Independently executed a firm-wide clearing firm migration',
      detail:
        'SFTP data capture, scheduled jobs, Grafana and Slack reporting, trade-level portfolio reconciliation, and middle-office ontology — in 3 days with zero system downtime.',
    },
  ],
  experience: [
    {
      title: 'Principal AI Solutions Architect',
      org: 'Edgehog Trading',
      start: 'Jul 2025',
      end: 'Present',
      bullets: [
        'Own agentic strategy, tooling, and spend ($15–20k/month across Claude, Codex, OpenRouter, and Cursor) for 30 high-value contributors — personally the top user of 29 (~20B tokens across ~42k agent requests in 12 months).',
        'Educated devs (hw/sw), quants, traders, ops, and compliance on agentic best practice — teach-ins, 1-on-1s, and provisioned learning materials — evolving all team members into full stack engineers and effective self-service researchers; our FPGA team now uses LLMs for SystemVerilog development, work I presented at STAC NYC and STAC Chicago.',
        'Designed and implemented a unified internal SaaS with RBAC, SSO, and over 50 apps — trader control surfaces, ops data access, self-updating architecture documentation, and onboarding flows — a platform colleagues now extend themselves, including our fully attributable firm-wide PnL dashboard, built by an ops team member I trained.',
        'Deployed approx. 30 open and proprietary MCP servers within challenging VPN constraints and system integrity controls — automated provisioning into all agent harnesses.',
        'Bridged JupyterHub-spawned containers to Cursor via SSH and deterministic user-port mapping — the quant team refactored legacy research notebooks that had gone untouched due to previously insurmountable complexity.',
        'Spearheaded a culture shift toward latest-release tooling (pg14→pg17, py3.7→py3.14, node18→node24, c++17→c++23, gitlab14.2→gitlab19.3) and inspired the dev team to rebuild our OMS in-house — ETA Q1 ’27, $750k per annum contract savings on completion.',
        'Simplified company-wide SSH keygen for GitLab, shared dev servers, and our Jupyter ecosystem via OS-agnostic Cursor slash commands; remade the company website and built an integrated recruitment pipeline with custom assessments and Rippling connectivity.',
        'First-year firm results alongside the transformation — PnL +120% YoY, production CI/CD pipelines +200% YoY.',
      ],
      stack: [
        'C++', 'Python', 'Java', 'TypeScript', 'LightGBM', 'PostgreSQL', 'Timescale', 'Iceberg', 'DuckDB', 'Polars',
        'Arrow', 'Trino', 'Parquet', 'Avro', 'Protobuf', 'gRPC', 'Dagster', 'Docker', 'Grafana', 'Prometheus', 'Loki',
        'Tempo (OTEL)', 'Claude', 'Codex', 'Cursor', 'OpenCode', 'LangGraph', 'LangSmith', 'MCP', 'Qdrant', 'Neo4j',
        'vLLM', 'CUDA', 'Linux',
      ],
    },
    {
      title: 'Founder & CEO',
      org: 'The Blox Office',
      start: 'Mar 2018',
      end: 'Present',
      bullets: [
        'Cultivated a regionally recognized brand in the form of a Chicago-based ticketing platform that caters to local art and culture exhibitions, boutique electronic music concerts, and niche community-driven event series.',
        'Bootstrapped SaaS product to +$3m gross volume ($300k net) by establishing and maintaining relationships with over 100 event producers — ticketing for 2k events across 4 states and 3 countries, with 35k users, 40k orders, and 70k tickets issued.',
        'Provided speaker and backline rentals for several nationally recognized brands (Mixmag, SPIN Magazine, Auris, Resolute, House Calls).',
      ],
      stack: [
        'Django', 'ASP.NET', 'React', 'Next.js', 'Python', 'C#', 'PHP', 'PostgreSQL', 'SQL Server', 'Redis', 'Stripe',
        'Twilio', 'AWS', 'Azure', 'Heroku', 'Vercel', 'Render', 'GitHub', 'Docker',
      ],
    },
    {
      title: 'Director, Process & Innovation',
      org: 'Zentro Internet',
      start: 'Jul 2020',
      end: 'Dec 2023',
      bullets: [
        'Lead engineer responsible for identifying and correcting company-wide operational bottlenecks and fundamental system deficiencies.',
        'Coded the ETL repository that interpreted, cleaned, and migrated acquired companies’ data through a year of PE-driven M&A, cementing our systems as the favored architecture throughout the mergers.',
        'Developed a comprehensive Python SDK for an external SaaS in under 2 months, eliminating internal billing churn.',
      ],
      stack: [
        'Python', 'JavaScript', 'GraphQL', 'REST', 'AWS (IAM, Lambda, EC2, DynamoDB, S3)', 'GCP (BigQuery)', 'Azure AD',
        'Salesforce', 'Asana', 'Retool', 'WordPress',
      ],
    },
    {
      title: 'Teaching Assistant',
      org: 'University of Chicago',
      start: 'Feb 2019',
      end: 'Mar 2019',
      bullets: [
        'Conducted extensive self-learning and compiled research on blockchain technology for an experimental Booth MBA course.',
        'Served as the technology domain expert, answered technical inquiries in class, and graded work submitted by the 60 MBA candidates.',
      ],
    },
    {
      title: 'Patent Engineer',
      org: 'Invention Mine',
      start: 'Feb 2014',
      end: 'Mar 2018',
      bullets: [
        'Composed 75 provisional and non-provisional patent applications and consistently engineered winning office action responses; led the advancement of an IP portfolio later acquired by Robert Bosch GmbH — 5 cross-referenced applications on a Multivariable Feedback Particle Filter (Sequential Monte Carlo).',
        'Fields of expertise: Digital Signal Processing (Polar OFDM), wireless network protocols (802.11, 5G), object recognition, 2D-to-3D reconstruction, holography, image and video encoding, advanced modeling and event detection in periodic signals, virtual and augmented reality, biometrics, IoT, HUDs, blockchain, flexible circuits, and haptics.',
      ],
    },
    {
      title: 'Co-Founder & Product Owner',
      org: 'Rolomit',
      start: 'Feb 2016',
      end: 'Oct 2016',
      bullets: [
        'Lead product architect — managed hiring, design, and development for a SaaS startup targeting Singapore’s hospitality industry.',
        'Relocated and worked on-site in New Delhi, India.',
      ],
    },
    {
      title: 'Research Assistant',
      org: 'Kwiat Quantum Information Group, UIUC',
      start: 'May 2012',
      end: 'Sep 2012',
      bullets: [
        'Modeled and built an optics bench setup and data acquisition controller for first and second order autocorrelation and phase retrieval of femtosecond laser pulses in the UV bandwidth.',
      ],
    },
  ],
  education: [
    {
      degree: 'BS Engineering Physics',
      school: 'University of Illinois Urbana-Champaign',
      start: 'Aug 2009',
      end: 'Dec 2013',
      notes: ['Certificate in Technology Commercialization', 'James Scholar ’09–’10', 'Dean’s List Fall ’13'],
    },
  ],
  skills: [
    'Market Data & Order Entry Infrastructure (MDP3, iLink, pcap)',
    'Data ETL & BI',
    'Agent Automation',
    'Context Engineering',
    'Python Scripting',
    'On-prem & Cloud Solutions',
    'First Principles Thinking',
    'Crisis Navigation',
    'Team Building',
    'Technical Writing',
    'Product Ownership',
  ],
  interests: [
    'Quantum Computing', 'Homomorphic Encryption', 'Fusion', 'Space Exploration', 'Chess', 'Tennis', 'Snowboarding',
    'Vinyl DJing', 'Electronic Music', 'Charity & Volunteering',
  ],
};

/** Plain-text rendering for the model and for MCP hosts without UI support. */
export function resumeToText(r: Resume = RESUME): string {
  const lines: string[] = [];
  lines.push(`${r.name} — ${r.headline}`);
  lines.push(`${r.location} · ${r.email} · ${r.website} · PDF: ${r.pdfUrl}`);
  lines.push('', 'SUMMARY', r.summary, '', 'SELECTED HIGHLIGHTS');
  for (const h of r.highlights) lines.push(`- ${h.title}: ${h.detail}`);
  lines.push('', 'EXPERIENCE');
  for (const e of r.experience) {
    lines.push(`${e.title} | ${e.org} | ${e.start} – ${e.end}`);
    for (const b of e.bullets) lines.push(`  - ${b}`);
    if (e.stack) lines.push(`  Utilized: ${e.stack.join(', ')}`);
  }
  lines.push('', 'EDUCATION');
  for (const ed of r.education) lines.push(`${ed.degree} | ${ed.school} | ${ed.start} – ${ed.end} | ${ed.notes.join(' · ')}`);
  lines.push('', `SKILLS: ${r.skills.join(', ')}`, `INTERESTS: ${r.interests.join(', ')}`);
  return lines.join('\n');
}
