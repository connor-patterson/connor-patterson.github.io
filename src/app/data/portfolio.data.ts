import type { CapabilityGroup, CaseStudy, Metric, ProjectCard } from '../core/portfolio.models';

export interface PortfolioLink {
  readonly label: string;
  readonly displayValue: string;
  readonly href: string;
  readonly external: boolean;
  readonly ariaLabel: string;
}

export interface PortfolioAsset {
  readonly src: string;
  readonly alt: string;
}

export interface PortraitAsset extends PortfolioAsset {
  readonly width: number;
  readonly height: number;
}

export interface ResumeAsset extends PortfolioAsset {
  readonly downloadName: string;
}

export interface PatchNote {
  readonly year: '2023' | '2024' | '2025' | '2026';
  readonly label: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly tools: readonly string[];
}

export interface ProfileFact {
  readonly label: string;
  readonly value: string;
}

export interface ResumeHighlight {
  readonly label: string;
  readonly value: string;
}

export interface DiagramNode {
  readonly label: string;
  readonly detail: string;
}

export interface ImpactDiagram {
  readonly title: string;
  readonly description: string;
  readonly nodes: readonly DiagramNode[];
}

export interface ProjectDetail {
  readonly evidence: {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
    readonly caption: string;
  };
  readonly decisionLog: {
    readonly constraint: string;
    readonly rejected: string;
    readonly choice: string;
    readonly validation: string;
  };
}

export const PORTFOLIO_LINKS = {
  email: {
    label: 'Email Connor',
    displayValue: 'connor.patter@aol.com',
    href: 'mailto:connor.patter@aol.com?subject=Hello%20from%20PatterOS',
    external: false,
    ariaLabel: 'Email Connor Patterson',
  },
  linkedIn: {
    label: 'LinkedIn',
    displayValue: 'linkedin.com/in/con-patter38',
    href: 'https://www.linkedin.com/in/con-patter38/',
    external: true,
    ariaLabel: "Open Connor Patterson's LinkedIn profile in a new tab",
  },
  github: {
    label: 'GitHub',
    displayValue: 'github.com/connorpatterson5',
    href: 'https://github.com/connorpatterson5',
    external: true,
    ariaLabel: "Open Connor Patterson's GitHub profile in a new tab",
  },
  predictChainPaper: {
    label: 'Read the paper',
    displayValue: 'arxiv.org/abs/2307.15168',
    href: 'https://arxiv.org/abs/2307.15168',
    external: true,
    ariaLabel: 'Read the PredictChain paper on arXiv in a new tab',
  },
  accessibilityFeedback: {
    label: 'Send accessibility feedback',
    displayValue: 'Email Connor',
    href: 'mailto:connor.patter@aol.com?subject=Accessibility%20feedback%20for%20PatterOS',
    external: false,
    ariaLabel: 'Email Connor Patterson with accessibility feedback',
  },
} as const satisfies Readonly<Record<string, PortfolioLink>>;

export const PORTFOLIO_ASSETS = {
  portrait: {
    src: 'assets/connor-profile.jpg',
    alt: 'Connor Patterson',
    width: 200,
    height: 200,
  },
  resume: {
    src: 'assets/ConnorPattersonResume2026.pdf',
    alt: 'Connor Patterson 2026 résumé PDF',
    downloadName: 'ConnorPattersonResume2026.pdf',
  },
} as const satisfies {
  readonly portrait: PortraitAsset;
  readonly resume: ResumeAsset;
};

export const START_COPY = {
  eyebrow: 'Lead Full Stack Software Engineer · RPI CS · AWS Certified',
  title: 'I build full stack software and games.',
  paragraphs: [
    'At work, I use Angular, Java, Spring, and AWS to improve production systems from the interface through the API.',
  ],
  status: 'Currently building Isotara after work.',
} as const;

export const START_METRICS = [
  {
    value: '600K+',
    label: 'monthly transactions',
    detail: 'Production insurance quoting platform.',
  },
  {
    value: '50.51%',
    label: 'lower tracked latency',
    detail: '58.75 seconds down to 29.08 seconds.',
  },
  {
    value: '$3M',
    label: 'annual savings contribution',
    detail: 'From production platform improvements.',
  },
] as const satisfies readonly Metric[];

export const IMPACT_INTRO =
  'A few deeper case studies, plus a release history from my time at State Farm.';

export const IMPACT_CASE_STUDIES = [
  {
    id: 'critical-path',
    eyebrow: 'Performance · Insurance quoting platform',
    title: 'Improved a slow insurance quote flow.',
    challenge:
      'A quoting flow repeated expensive work in the browser and API. I traced the slow path and removed the waste.',
    approach: [
      'Used real user monitoring and API profiling to find the slow steps.',
      'Hoisted converter calls, added safe endpoint and Redis caching, deduplicated requests in flight, and skipped updates that changed nothing.',
      'Checked the work with automated tests, code review, release checks, and production telemetry.',
    ],
    results: [
      {
        value: '58.75s → 29.08s',
        label: 'tracked flow',
        detail: 'A measured 50.51% reduction, with the latest observed total at 26.09s.',
      },
      {
        value: '66.43%',
        label: 'lower Vehicle Detail latency',
        detail: 'Measured week over week.',
      },
      {
        value: '24.3%',
        label: 'lower Review Quote latency',
        detail: 'Measured after the supporting optimizations shipped.',
      },
    ],
    role: 'I profiled the flow, built the fixes, coordinated the connected codebases, and watched the production result.',
    stack: ['Angular', 'Java/Spring', 'Redis', 'Dynatrace RUM', 'API profiling'],
  },
  {
    id: 'secure-delivery',
    eyebrow: 'Security · Four connected codebases',
    title: 'Delivered a secure change across four codebases.',
    challenge:
      'Required identifiers had to reach downstream systems without appearing in the interface. I mapped and coordinated the full path.',
    approach: [
      'Mapped the path through the Angular UI, quoting API, policy integration, and shared parameter service.',
      'Kept sensitive values out of displayed browser state while preserving downstream contracts.',
      'Coordinated test coverage, review, CI/CD validation, and release checks.',
    ],
    results: [
      {
        value: '4 codebases',
        label: 'coordinated end to end',
        detail: 'Coordinated across interface, API, integration, and shared service code.',
      },
    ],
    role: 'I coordinated delivery and validation from the interface through the downstream integration.',
    stack: ['Angular', 'Java/Spring', 'Automated testing', 'CI/CD', 'Secure SDLC'],
  },
] as const satisfies readonly CaseStudy[];

export const IMPACT_DIAGRAMS: Readonly<Record<string, ImpactDiagram>> = {
  'critical-path': {
    title: 'Where the time went',
    description:
      'A sanitized view of the measured request path and the places where repeated work was removed.',
    nodes: [
      { label: 'Angular flow', detail: 'Real user timing' },
      { label: 'Java API', detail: 'Profile hot paths' },
      { label: 'Redis', detail: 'Reuse safe results' },
      { label: 'Production', detail: 'Measure again' },
    ],
  },
  'secure-delivery': {
    title: 'The identifier path',
    description:
      'A high level map of the four codebases coordinated for the change. Internal contracts are intentionally omitted.',
    nodes: [
      { label: 'Angular UI', detail: 'Keep values hidden' },
      { label: 'Quoting API', detail: 'Carry the contract' },
      { label: 'Policy integration', detail: 'Pass downstream' },
      { label: 'Parameter service', detail: 'Shared source' },
    ],
  },
};

export const IMPACT_CASE_PAGES: Readonly<Record<string, string>> = {
  'critical-path': 'case-studies/latency/',
  'secure-delivery': 'case-studies/secure-delivery/',
};

export const IMPACT_PATCH_NOTES = [
  {
    year: '2026',
    label: 'Performance',
    title: 'Made repeated work happen once.',
    summary:
      'Moved expensive graph construction out of item loops, skipped no change writes, and added careful caching across the interface and services.',
    detail:
      'The work crossed Angular, Java services, and a rules platform. Cache boundaries, invalidation, automated checks, and a feature controlled rollout kept the changes safe.',
    tools: ['Angular', 'Java', 'Caching', 'Feature flags'],
  },
  {
    year: '2026',
    label: 'Full stack delivery',
    title: 'Took one form through four codebases.',
    summary:
      'Built the interface, service translation, rules logic, and configuration for one connected workflow.',
    detail:
      'I coordinated the dependencies and consolidated seven overlapping acceptance scenarios into three focused ones while retaining the intended checks.',
    tools: ['Angular', 'Java', 'Rules platform', 'Acceptance tests'],
  },
  {
    year: '2026',
    label: 'Edge cases',
    title: 'Hardened a complex vehicle workflow.',
    summary:
      'Closed the tracked edge cases around incomplete and ambiguous vehicle information across the interface and API.',
    detail:
      'The paired release was backed by focused API verification. Customer rules and internal identifiers are intentionally omitted here.',
    tools: ['Angular', 'API design', 'Regression testing', 'CI/CD'],
  },
  {
    year: '2026',
    label: 'Delivery judgment',
    title: 'Reverted first, then restored safely.',
    summary:
      'Pulled back a risky cross layer change, corrected its gating, and restored it after retrieval, save path, and acceptance validation.',
    detail:
      'Shipping well sometimes means stopping. The rollback protected the release while I fixed the boundary and proved the safer version.',
    tools: ['Feature flags', 'Regression testing', 'Release support'],
  },
  {
    year: '2025',
    label: 'Product instrumentation',
    title: 'Led an application wide analytics rollout.',
    summary:
      'Mapped interaction points, tagged shared components, added tests, validated live behavior with the vendor, and taught the team how to extend it.',
    detail:
      'The integration moved from inventory and component work to production launch, then continued through smaller cleanup passes as the application evolved.',
    tools: ['Angular', 'Component design', 'Unit tests', 'CI/CD'],
  },
  {
    year: '2025',
    label: 'Platform upkeep',
    title: 'Moved a shared library through Angular 17 and 18.',
    summary:
      'Worked through compatibility, lint, and unit test issues before rolling the upgrade into the application.',
    detail:
      'Later that year I completed the application move from Angular 18 to 19 and helped another team plan the same maintenance.',
    tools: ['Angular', 'TypeScript', 'Linting', 'Unit tests'],
  },
  {
    year: '2025',
    label: 'Mentorship',
    title: 'Helped an intern go from setup to shipped work.',
    summary:
      'Onboarded them across the interface, API, Java, and automated tests, then gradually handed over independent stories.',
    detail:
      'My role was to remove setup friction, pair on the early work, review the later work, and make sure the credit stayed with the person doing it.',
    tools: ['Pairing', 'Code review', 'Java', 'Automated tests'],
  },
  {
    year: '2024',
    label: 'Test reliability',
    title: 'Made a flaky test suite trustworthy.',
    summary:
      'Tracked intermittent failures through scenario selection and report processing, then repaired the automation instead of accepting the noise.',
    detail:
      'A more trustworthy suite meant failures carried useful signal again and the team spent less time rerunning uncertain results.',
    tools: ['Acceptance tests', 'Test reports', 'Debugging', 'Type safety'],
  },
  {
    year: '2024',
    label: 'Shared platform',
    title: 'Helped two applications move onto one UI library.',
    summary:
      'Shaped a lean component strategy, set up its repository and release tooling, and led migrations over several months.',
    detail:
      'The work included pipelines, linting, tests, semantic releases, compatibility checks, and coordination across application teams.',
    tools: ['Angular', 'Component libraries', 'Semantic release', 'CI/CD'],
  },
  {
    year: '2024',
    label: 'Browser debugging',
    title: 'Found the date bug that only Safari showed.',
    summary:
      'Compared MomentJS and DayJS behavior, isolated a masked date compatibility difference, and completed the migration with the missing browser case covered.',
    detail:
      'It was a small bug with a useful lesson: library migrations are not done when the compiler is happy. The real input paths still have to agree.',
    tools: ['TypeScript', 'DayJS', 'Safari', 'Cross browser tests'],
  },
  {
    year: '2023',
    label: 'Delivery tooling',
    title: 'Made failed test runs easier to diagnose.',
    summary:
      'Added pipeline reporting for failed acceptance tests and built a one command way to restart shared runners.',
    detail:
      'This was early infrastructure work that connected application development with the systems used to build and verify it.',
    tools: ['CI/CD', 'Shell', 'Test reporting', 'Build runners'],
  },
  {
    year: '2023',
    label: 'Quality',
    title: 'Tested beyond the happy path.',
    summary:
      'Strengthened a customer document flow with validation, responsive behavior, branch coverage, and mutation testing.',
    detail:
      'That work set the pattern I still follow: test what can break, keep the interface usable at different sizes, and clean up the path while I am there.',
    tools: ['Angular', 'Responsive CSS', 'Mutation tests', 'Validation'],
  },
] as const satisfies readonly PatchNote[];

export const BUILDS_INTRO =
  'A game in active development and a research project that won two awards.';

export const FEATURED_PROJECTS = [
  {
    id: 'isotara',
    title: 'Isotara',
    subtitle: 'Chemistry roguelike deckbuilder',
    status: 'Active development',
    description:
      'I’m building a chemistry roguelike deckbuilder in Godot with modular card effects, procedural encounters, and upgrade paths.',
    proof: [
      'Reusable effects keep new cards from becoming one off rule piles.',
      'Rapid prototypes help me compare ideas before I commit to them.',
    ],
    stack: ['Godot', 'GDScript', 'Game systems'],
    accent: 'green',
    primaryAction: {
      label: 'Play a game',
      appId: 'arcade',
    },
  },
  {
    id: 'predictchain',
    title: 'PredictChain',
    subtitle: 'Decentralized AI model marketplace',
    status: '2023',
    description:
      'I helped design a decentralized marketplace for sharing datasets, requesting model training, and querying trained models without relying on one cloud provider.',
    proof: [
      'Presented at ChainScience 2023.',
      'Won 1st Place and “Most Innovative Technology” at the 2023 MEGA-ACE Hackathon at RPI.',
    ],
    stack: ['Python', 'Algorand', 'ML pipelines'],
    accent: 'violet',
    primaryAction: {
      label: PORTFOLIO_LINKS.predictChainPaper.label,
      href: PORTFOLIO_LINKS.predictChainPaper.href,
    },
  },
] as const satisfies readonly ProjectCard[];

export const PROJECT_DETAILS: Readonly<Record<string, ProjectDetail>> = {
  isotara: {
    evidence: {
      src: 'assets/evidence/isotara-system-map.svg',
      alt: 'Diagram showing card data flowing through reusable effects into encounters and run progression',
      width: 960,
      height: 420,
      caption:
        'Portfolio system sketch based on the current Isotara architecture. This is not a gameplay screenshot.',
    },
    decisionLog: {
      constraint:
        'A growing card pool needs variety without turning every card into a special case.',
      rejected: 'One off logic scattered across individual cards.',
      choice: 'Reusable effect modules that cards and encounters can combine.',
      validation: 'Rapid prototypes, automated rule checks, and complete run playthroughs.',
    },
  },
  predictchain: {
    evidence: {
      src: 'assets/evidence/predictchain-system-map.svg',
      alt: 'Diagram showing datasets and training requests moving through a marketplace to compute nodes and model queries',
      width: 960,
      height: 420,
      caption:
        'Portfolio system sketch based on the published PredictChain paper. This is not a product screenshot.',
    },
    decisionLog: {
      constraint:
        'Public models can be hard to run, while data and model providers need a way to track how their resources are used.',
      rejected: 'A marketplace tied to one central compute provider.',
      choice:
        'A blockchain marketplace for dataset uploads, training requests, model queries, and participating compute nodes.',
      validation:
        'Published at ChainScience 2023 and awarded first place plus Most Innovative Technology at the 2023 MEGA ACE Hackathon.',
    },
  },
};

export const PROFILE_COPY = {
  eyebrow: 'About me',
  title: 'I’m Connor, a full stack software engineer.',
  paragraphs: [
    'I studied computer science at RPI with minors in Management and Media & Culture. I care how a system works, what it gets done, and whether people enjoy using it.',
    'Away from work, I build games, work out, and make time for games, film, and television.',
  ],
} as const;

export const CAPABILITY_GROUPS = [
  {
    title: 'Interface systems',
    items: ['Angular', 'TypeScript', 'JavaScript', 'React', 'HTML/CSS'],
  },
  {
    title: 'Services and APIs',
    items: ['Java', 'Spring/Spring Boot', 'Python', 'Node.js', 'Django', 'REST APIs', 'PostgreSQL'],
  },
  {
    title: 'Cloud and delivery',
    items: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'GitLab CI/CD'],
  },
  {
    title: 'Observability and security',
    items: [
      'Dynatrace RUM',
      'Splunk/log analysis',
      'Behavioral analytics',
      'Dependency remediation',
      'Secure SDLC',
    ],
  },
  {
    title: 'Working style',
    items: [
      'Automated testing',
      'Code review',
      'Mentorship',
      'Incident triage',
      'Production support',
      'Ownership across codebases',
    ],
  },
] as const satisfies readonly CapabilityGroup[];

export const PROFILE_FACTS = [
  { label: 'Education', value: 'B.S. Computer Science, RPI, 2023' },
  { label: 'Minors', value: 'Management · Media & Culture' },
  { label: 'Recognition', value: 'James A. Voorhies ’20 Scholar' },
  { label: 'Certification', value: 'AWS Certified Cloud Practitioner' },
] as const satisfies readonly ProfileFact[];

export const RESUME_COPY = {
  eyebrow: 'Résumé · 2026',
  title: 'One page, ready to share.',
  description: 'My experience, education, projects, and technical skills in one PDF.',
  privacyNote: 'My phone number stays in the PDF instead of appearing on the public site.',
} as const;

export const EVIDENCE_BRIEF = {
  src: 'evidence-brief.html',
  label: 'Open evidence brief',
  ariaLabel: 'Open the print friendly engineering evidence brief in a new tab',
} as const;

export const RESUME_HIGHLIGHTS = [
  {
    label: 'Current role',
    value: 'Lead Software Engineer, Full Stack',
  },
  {
    label: 'Production scale',
    value: '600K+ monthly quote transactions across 20 states',
  },
  {
    label: 'Measured impact',
    value: '50.51% lower tracked sales flow latency',
  },
  {
    label: 'Independent builds',
    value: 'Isotara and PredictChain',
  },
] as const satisfies readonly ResumeHighlight[];

export const CONTACT_COPY = {
  eyebrow: 'Say hello',
  title: 'Let’s talk.',
  description:
    'Email is the quickest way to reach me. You can also find my work on GitHub and LinkedIn.',
  privacyNote: 'No form or account. These links go straight to me.',
} as const;

export const ACCESSIBILITY_COPY = {
  title: 'Accessibility',
  description:
    'PatterOS supports keyboard navigation, visible focus, reduced motion, forced colors, zoom, and narrow screens. If something gets in your way, please tell me.',
  feedbackLink: PORTFOLIO_LINKS.accessibilityFeedback,
} as const;

export const CONTACT_LINKS = [
  PORTFOLIO_LINKS.email,
  PORTFOLIO_LINKS.linkedIn,
  PORTFOLIO_LINKS.github,
] as const satisfies readonly PortfolioLink[];
