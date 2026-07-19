/**
 * Marketing-site content layer.
 *
 * This module is the single source of truth for website copy and structured
 * content. It is deliberately shaped like CMS output (flat, typed records with
 * slugs) so the planned tenant website-builder can swap this file for
 * database-backed content without touching page components.
 */

export const company = {
  name: "Meridian Talent Partners",
  product: "RecruitOS",
  tagline: "UK-calibre talent, sourced from South Africa",
  description:
    "A specialist recruitment agency connecting UK employers with exceptional South African talent — permanent, contract and executive search, powered by an AI-native recruitment platform.",
  email: "hello@recruitos.dev",
  phone: "+27 83 000 0000",
  address: "Johannesburg, South Africa · London, United Kingdom",
} as const;

export const stats = [
  { value: "1,200+", label: "Placements made" },
  { value: "94%", label: "12-month retention" },
  { value: "18 days", label: "Average time to shortlist" },
  { value: "150+", label: "UK clients served" },
] as const;

export const trustedBy = [
  "Northgate Systems",
  "Albion Health",
  "Fintrust Capital",
  "Cavendish Legal",
  "Brightline Energy",
  "Stonebridge Retail",
] as const;

export const services = [
  {
    slug: "permanent",
    title: "Permanent Recruitment",
    description:
      "Full-cycle permanent hiring with AI-assisted matching, structured interviews and a 12-month replacement guarantee.",
    points: ["Role scoping & market mapping", "AI-shortlisted candidates in days", "Offer management & onboarding support"],
  },
  {
    slug: "contract",
    title: "Contract Recruitment",
    description:
      "Compliant contractor placement into UK engagements, with IR35 classification support and rapid turnaround.",
    points: ["IR35 status determination support", "Timesheets & invoicing handled", "48-hour shortlists for urgent roles"],
  },
  {
    slug: "executive",
    title: "Executive Search",
    description:
      "Discreet, research-led search for leadership roles, drawing on cross-border networks in SA and the UK.",
    points: ["Research-led longlisting", "Structured leadership assessment", "Confidential approach management"],
  },
  {
    slug: "international",
    title: "International Recruitment",
    description:
      "Cross-border hiring done properly: UK right-to-work verification, visa tracking and time-zone-aligned teams.",
    points: ["Right-to-work & visa guidance", "GBP/ZAR-aware compensation design", "Remote-first onboarding playbooks"],
  },
] as const;

export const industries = [
  { title: "Technology & Engineering", description: "Software engineers, data specialists, DevOps and product talent for UK scale-ups and enterprises." },
  { title: "Finance & Fintech", description: "Accountants, analysts, risk and compliance professionals for banks, funds and fintechs." },
  { title: "Healthcare", description: "Clinical and non-clinical staffing for private providers and health-tech companies." },
  { title: "Legal & Professional Services", description: "Paralegals, legal ops and fee-earners for firms embracing remote delivery." },
  { title: "Sales & Customer Success", description: "Revenue teams that work UK hours with native-level English and strong cultural fit." },
  { title: "Creative & Marketing", description: "Designers, content and performance marketers for agencies and in-house teams." },
] as const;

export const process = [
  { step: "01", title: "Brief & scope", description: "We map the role, success profile, compensation banding and time-zone requirements with your hiring manager." },
  { step: "02", title: "AI-assisted sourcing", description: "Our platform screens our talent database and live market, ranking candidates by skills, experience and salary fit." },
  { step: "03", title: "Human vetting", description: "Consultants interview every shortlisted candidate — communication, motivation, right-to-work and references." },
  { step: "04", title: "Shortlist & interviews", description: "You receive a scored shortlist with AI summaries. We coordinate interviews across UK/SA time zones." },
  { step: "05", title: "Offer & compliance", description: "Offer negotiation, contracts, UK right-to-work verification and background checks — all tracked in one place." },
  { step: "06", title: "Onboarding & care", description: "Structured onboarding support and 30/60/90-day check-ins to protect your hire." },
] as const;

export const testimonials = [
  {
    quote:
      "Meridian filled three senior engineering roles we'd been struggling with for six months — in under four weeks. The shortlist quality was unlike anything we'd seen from UK-only agencies.",
    name: "Sarah Whitfield",
    role: "VP Engineering, Northgate Systems",
  },
  {
    quote:
      "The IR35 support alone was worth it. They handled classification, contracts and timesheets so we could just get on with the project.",
    name: "James O'Connell",
    role: "Programme Director, Fintrust Capital",
  },
  {
    quote:
      "As a candidate, the process was the most transparent I've experienced. I always knew where I stood, and the salary guidance was spot on.",
    name: "Thandi Mokoena",
    role: "Data Engineer, placed in London (remote)",
  },
] as const;

export type Job = {
  slug: string;
  title: string;
  type: "Permanent" | "Contract";
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  salary: string;
  summary: string;
  tags: string[];
};

/** Sample roles; Phase 3 replaces this with live ATS jobs published per tenant. */
export const jobs: Job[] = [
  {
    slug: "senior-react-engineer",
    title: "Senior React Engineer",
    type: "Permanent",
    location: "London (remote from SA)",
    workMode: "Remote",
    salary: "£65,000 – £80,000",
    summary: "Product-led fintech building consumer savings tools. React 19, TypeScript, Next.js.",
    tags: ["React", "TypeScript", "Next.js"],
  },
  {
    slug: "management-accountant",
    title: "Management Accountant",
    type: "Permanent",
    location: "Manchester (remote from SA)",
    workMode: "Remote",
    salary: "£45,000 – £55,000",
    summary: "Group reporting and FP&A for a private-equity-backed healthcare group. CIMA/SAICA welcome.",
    tags: ["CIMA", "FP&A", "Excel"],
  },
  {
    slug: "devops-contractor",
    title: "DevOps Engineer (Contract)",
    type: "Contract",
    location: "Remote (UK client)",
    workMode: "Remote",
    salary: "£450 – £550/day",
    summary: "6-month AWS/Kubernetes migration for a retail platform. Outside IR35.",
    tags: ["AWS", "Kubernetes", "Terraform"],
  },
  {
    slug: "customer-success-lead",
    title: "Customer Success Lead",
    type: "Permanent",
    location: "London (hybrid options)",
    workMode: "Hybrid",
    salary: "£50,000 – £60,000 + bonus",
    summary: "Own enterprise renewals and expansion for a B2B SaaS scale-up. UK hours.",
    tags: ["SaaS", "Enterprise", "CS"],
  },
] as const;

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  body: string[];
};

export const articles: Article[] = [
  {
    slug: "uk-companies-hiring-south-african-talent",
    title: "Why UK companies are building teams in South Africa",
    category: "Market Insight",
    date: "2026-06-12",
    excerpt:
      "Time-zone overlap, native English, and a deep professional talent pool — the case for SA as the UK's smartest nearshore market.",
    body: [
      "The UK talent market remains one of the tightest in Europe. Vacancy-to-applicant ratios in engineering, finance and healthcare have barely recovered since 2023, and salary inflation continues to outpace budgets.",
      "South Africa offers something no other nearshore market can combine: a one-to-two-hour time-zone difference with London, native-level business English, and professional accreditation frameworks (SAICA, ECSA) that map cleanly onto UK equivalents.",
      "The economics matter too. A senior engineer in Johannesburg typically costs 40–60% of the equivalent London hire — not by underpaying, but because cost of living and currency dynamics differ. Structured properly, both sides win.",
      "The companies doing this well treat SA hires as first-class team members: same standups, same tooling, same career ladders. The ones that fail treat it as outsourcing. The difference shows up in retention within a year.",
    ],
  },
  {
    slug: "ir35-guide-for-sa-contractors",
    title: "IR35 for South African contractors: a practical guide",
    category: "Compliance",
    date: "2026-05-28",
    excerpt:
      "What SA-based contractors and their UK clients need to know about status determinations, and where the traps are.",
    body: [
      "IR35 (the UK's off-payroll working rules) determines whether a contractor is genuinely self-employed or a 'disguised employee' for tax purposes. For UK clients engaging SA-based contractors, the rules still matter — and misclassification risk sits with the client.",
      "The key tests remain control, substitution and mutuality of obligation. A contractor who works fixed hours, under direct supervision, on open-ended work, looks like an employee regardless of what the contract says.",
      "For offshore contractors the analysis has extra wrinkles: where the work is performed, where the intermediary is registered, and whether the client has a UK 'connection' under the rules. Most UK end-clients will still run a status determination to be safe.",
      "Our advice: get the determination done before the engagement starts, paper the working practices to match, and review at renewal. We support this as part of every contract placement.",
    ],
  },
  {
    slug: "ai-in-recruitment-what-actually-works",
    title: "AI in recruitment: what actually works in 2026",
    category: "AI & Technology",
    date: "2026-07-02",
    excerpt:
      "Beyond the hype: where AI genuinely moves the needle in hiring, and where human judgement still wins.",
    body: [
      "Every ATS now claims to be 'AI-powered'. Having built our own AI-native platform, we can tell you where the technology genuinely earns its keep — and where it's marketing.",
      "What works: CV parsing and enrichment (near-perfect extraction saves hours per role), semantic matching (finding the candidate whose experience means the same thing even when the keywords differ), and interview preparation (structured question sets generated from the actual role and CV).",
      "What doesn't work yet: fully automated screening decisions. Bias amplification is real, UK and EU regulation is tightening, and candidates can tell when no human has read their application. We use AI to rank and explain — humans decide.",
      "The net effect on our desk: consultants spend 60% less time on admin and twice as much time talking to people. That's the right shape for this technology.",
    ],
  },
];

export type CaseStudy = {
  slug: string;
  client: string;
  industry: string;
  title: string;
  challenge: string;
  approach: string;
  results: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "northgate-engineering-team",
    client: "Northgate Systems",
    industry: "Technology",
    title: "Standing up a 12-person engineering pod in one quarter",
    challenge:
      "A London software consultancy had won a major contract but couldn't staff it — six months of UK-only hiring had produced two hires against a target of twelve.",
    approach:
      "We mapped the twelve roles into three waves, ran AI-assisted sourcing across our SA network, and delivered scored shortlists weekly. Right-to-work, contracts and equipment logistics were handled through our platform.",
    results: ["12 hires in 11 weeks", "£380k annual saving vs. London benchmarks", "100% retention at 12 months"],
  },
  {
    slug: "albion-health-finance",
    client: "Albion Health",
    industry: "Healthcare",
    title: "Rebuilding a finance function after an acquisition",
    challenge:
      "Post-acquisition, a private healthcare group needed a management accountant, two analysts and a finance systems specialist — urgently, and within a constrained budget.",
    approach:
      "A single consultant ran the brief end-to-end with pooled sourcing across the four roles. Candidates were assessed on group-reporting experience and system skills (Sage, Power BI), with SAICA-accredited finalists.",
    results: ["4 roles filled in 6 weeks", "First-submission interview rate of 82%", "Function fully operational for year-end close"],
  },
  {
    slug: "fintrust-contract-squad",
    client: "Fintrust Capital",
    industry: "Financial Services",
    title: "A compliant contractor squad for a 9-month migration",
    challenge:
      "A payments migration needed five specialist contractors — DevOps, data and QA — with clean IR35 status and immediate starts.",
    approach:
      "We delivered status determinations, contracts and onboarding inside two weeks, with timesheeting and invoicing run through our platform in GBP.",
    results: ["5 contractors onboarded in 14 days", "Zero IR35 disputes", "Migration delivered one month early"],
  },
];

export const faqs = [
  {
    question: "How does remote hiring from South Africa work legally?",
    answer:
      "Most clients engage SA-based staff either through an Employer of Record, as compliant contractors, or via their own SA entity. We advise on the right structure for your situation and handle right-to-work verification for any UK-based placements.",
  },
  {
    question: "What about time zones?",
    answer:
      "South Africa is UTC+2 — just one hour ahead of London in summer and two in winter. Your SA team members work your business day, live.",
  },
  {
    question: "What does it cost?",
    answer:
      "Permanent placements are a percentage of first-year salary, payable on start. Contract placements are a margin on the day rate. No exclusivity, no retainers for standard roles — see our Pricing page for detail.",
  },
  {
    question: "What if a hire doesn't work out?",
    answer:
      "Permanent placements carry a replacement guarantee: if the hire leaves within the guarantee period, we refill the role at no fee. Terms by service level.",
  },
  {
    question: "Do you only place South African candidates?",
    answer:
      "SA is our core talent market, but our executive search and international desks run cross-border briefs across the UK, EU and wider Africa.",
  },
  {
    question: "How do candidates get started?",
    answer:
      "Register through our Candidates page. Your profile is parsed, enriched and matched against live roles — and a consultant reviews every application personally.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Contingent",
    price: "15%",
    unit: "of first-year salary",
    description: "Standard permanent recruitment. Pay only on a successful start.",
    features: ["AI-assisted shortlists", "Structured interview support", "3-month replacement guarantee", "No exclusivity"],
    cta: "Start a brief",
    highlighted: false,
  },
  {
    name: "Priority",
    price: "20%",
    unit: "of first-year salary",
    description: "Dedicated consultant and accelerated SLAs for critical roles.",
    features: ["Everything in Contingent", "48-hour first shortlist", "Dedicated senior consultant", "6-month replacement guarantee", "Salary benchmarking report"],
    cta: "Talk to us",
    highlighted: true,
  },
  {
    name: "Embedded",
    price: "Custom",
    unit: "monthly subscription",
    description: "An embedded talent team for sustained hiring — our recruiters, your brand.",
    features: ["Everything in Priority", "Multi-role pipelines", "Employer-brand support", "Client portal & live reporting", "Quarterly talent-market reviews"],
    cta: "Design your plan",
    highlighted: false,
  },
] as const;

export const careersRoles = [
  { title: "Senior Recruitment Consultant (Tech desk)", location: "Johannesburg · Hybrid", type: "Permanent" },
  { title: "Business Development Consultant (UK market)", location: "Remote (SA)", type: "Permanent" },
  { title: "Candidate Consultant", location: "Cape Town · Hybrid", type: "Permanent" },
] as const;
