# PatterOS Roadmap

## Roadmap principles

PatterOS should feel complete without feeling crowded. The strongest personal sites let the medium demonstrate the maker's craft, so future work should improve a real interaction, a useful tool, or the quality of the evidence. Functional software earns its place more readily than decorative operating system mimicry.

The first view stays concise. A visitor can open deeper evidence, case studies, and secondary portfolio applications when they want it instead of receiving every detail at once. PatterOS adapts these principles through its own components, copy, icons, motion, and visual system; another portfolio's style is never a template to copy.

The following contracts remain fixed unless a future architecture decision explicitly replaces them:

- Professional evidence follows a roughly one second automatic boot that becomes nearly instant with reduced motion.
- The project remains functional as a static GitHub Pages site.
- `main` is source and `gh-pages` is generated output.
- The repository owns no custom GitHub Actions workflow.
- The Pages base is `/` and navigation uses hash routes.
- No external runtime fonts, scripts, styles, ads, or tracking are required.
- Games and utilities are optional and never gate résumé or contact information.
- Reduced motion, keyboard navigation, touch, and compact layouts are core modes.
- Local visitor data is versioned, stays on the device, and is never presented as cloud storage.

## August 2026 build status

`Implemented` means the capability exists in the source for this iteration. Each release still requires the full local gate and a manual smoke check of the deployed GitHub Pages artifact.

| Lane                 | Status      | Current scope                                                                                       |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Focused desktop      | Implemented | Eight real applications in a compact three column desktop cluster                                   |
| Shared navigation    | Implemented | Desktop, launcher, taskbar, routes, and content links share the typed application registry          |
| Window clarity       | Implemented | Familiar minimize, maximize, and close controls with advanced actions inside a compact options menu |
| Desktop interaction  | Implemented | Pointer light, local grid reveal, and bounded click or tap signals with reduced motion support      |
| Familiar arcade      | Implemented | Snake, Memory Match, Tic Tac Toe, and Minesweeper                                                   |
| System explorer      | Implemented | Interactive client, service, and delivery decisions grounded in the Work Log                        |
| GitHub pulse         | Implemented | Read-only public repository data with a clear offline fallback                                      |
| Evidence and access  | Retained    | Optional case study depth, print brief, responsive layouts, high contrast, and Comfortable Reading  |
| Optional services    | Gated       | No network service because none currently justifies its privacy, reliability, or operating cost     |
| Release verification | Per release | `npm run check`, visual review, and a cold cache check of the published Pages site                  |

## Release closeout

These are release gates, not future polish:

- Verify every résumé derived statement and external profile URL.
- Exercise Start Here, Work Log, Builds, PatterOS Arcade, About Connor, Résumé, Say Hello, and Desktop Settings.
- Exercise open, close, minimize, restore, maximize, drag, resize, options, route sync, and compact behavior.
- Confirm all ten purposeful shortcuts appear on the desktop and match the launcher.
- Validate every color mode, reduced motion, 200% zoom, keyboard only use, and common phone, tablet, and desktop viewports.
- Test all four games through play and restart; keep the real-time Snake pause and visibility checks.
- Test pointer and tap signals, control exclusion, bounded cleanup, reduced motion, and forced colors.
- Confirm the résumé downloads, social card renders at 1200 by 630, and metadata uses the production URL.
- Run the local release gate and a cold cache smoke test against the deployed Pages URL.
- Keep the GitHub repository homepage metadata aligned with the live Pages URL.

## Enhancement lanes

### Lane A: Useful desktop

Goal: make the operating system metaphor earn its space through calm, working interactions.

Current decisions:

- [x] Keep the desktop to ten purposeful shortcuts in one compact cluster.
- [x] Keep secondary portfolio applications in the launcher and contextual links.
- [x] Use conventional title bar controls and move size, share, and reposition actions into options.
- [x] Add an interactive desktop field that remains decorative and never blocks controls.
- [ ] Observe real visitors before adding another utility.
- [ ] Add a new utility only when it solves a distinct visitor task and remains useful without a network.

Exit criteria for future utility work:

- The task is easier inside PatterOS than in a decorative mock window.
- The first screen does not gain another shortcut without removing or combining something else.
- Storage behavior, failure handling, keyboard access, and responsive layout are tested.

### Lane B: Evidence with restraint

Goal: let recruiters understand the strongest work quickly, then choose how deep to go.

Current decisions:

- [x] Keep the opening view concise with clear routes to work, projects, résumé, and contact.
- [x] Retain architecture diagrams, decision logs, direct case pages, and the print friendly evidence brief as optional depth.
- [x] Keep employer sensitive implementation details generalized and claims tied to approved public sources.
- [ ] Run a short usability review with people unfamiliar with the site and record where they hesitate.
- [ ] Tighten or remove any section that does not help a visitor understand judgment, impact, or personality.

Exit criteria:

- A new artifact answers a likely reviewer or interviewer question.
- Detail opens on demand and does not increase first view density.
- Every public claim is supportable and suitable for disclosure.

### Lane C: Familiar arcade

Goal: offer a quick break that is immediately understandable and still shows implementation quality.

Current decisions:

- [x] Replace the previous simulation games with four familiar, one-player games.
- [x] Support keyboard and touch input with visible instructions.
- [x] Keep rules in pure TypeScript modules and results in local storage.
- [x] Keep the arcade outside the initial portfolio bundle.
- [ ] Add another game only if it has a distinct interaction and does not make the arcade harder to scan.

Exit criteria:

- A first time visitor can begin without learning project specific vocabulary.
- Restart, teardown, reduced motion, touch, keyboard, and repeated open cycles remain reliable.
- No game adds accounts, advertising, remote assets, or a network leaderboard.

### Lane D: Shareability and URL clarity

Goal: make a specific piece of evidence easy to send before or after an interview.

Current decisions:

- [x] Keep stable copyable hash routes for application windows.
- [x] Keep direct static case study pages with successful canonical URLs.
- [x] Keep the evidence brief printable without the Angular runtime.
- [ ] Plan any shorter GitHub Pages URL as a deliberate repository or account migration, with verified availability and redirects before changing the current live address.

Exit criteria:

- Existing links keep working or have an explicit redirect plan.
- Root portfolio content remains the canonical entry point.
- Search and social metadata return successful responses and the intended preview image.
- A URL change does not require paid hosting or a project owned workflow.

### Lane E: Accessibility and comfort

Goal: make the desktop metaphor unusually comfortable to use rather than merely visually novel.

Current decisions:

- [x] Provide high contrast, reduced motion, and a nonoverlapping reading layout.
- [x] Preserve semantic content and normal document flow when free dragging is unavailable.
- [x] Include keyboard accessible resize and window options alongside pointer controls.
- [x] Provide live game status and explicit labels for icon only controls.
- [ ] Repeat manual screen reader and zoom or reflow reviews after every material shell change.

Exit criteria:

- Manual testing includes keyboard, screen reader, zoom and reflow, coarse pointer, reduced motion, and forced colors.
- Preferences have deterministic defaults and versioned persistence.
- No comfort option hides important content or creates a second incompatible information architecture.

### Lane F: Optional services

Goal: add a network capability only when its value outweighs privacy, availability, and cost.

Possible examples:

- A spam resistant contact relay
- Privacy preserving aggregate visit counts
- Opt in anonymous arcade completion statistics

Entry criteria:

- Static email, GitHub, and LinkedIn contact is demonstrably insufficient.
- Data, retention, consent, abuse prevention, failure mode, and deletion behavior are documented.
- Secrets live outside the client repository.
- A hard zero dollar or approved spending ceiling exists.
- The portfolio and games remain useful when the service is offline.

No network service is planned for this release.

## Prioritization

| Priority | Future work                                    | User value                        | Dependency                                  |
| -------- | ---------------------------------------------- | --------------------------------- | ------------------------------------------- |
| P0       | Local gate, visual review, and live smoke test | Trustworthy release               | Integrated source                           |
| P1       | Short unfamiliar visitor usability review      | Clearer first visit and less copy | Stable published interface                  |
| P1       | Safe shorter URL migration plan                | More memorable sharing            | Namespace availability and redirect plan    |
| P2       | Background refinements from observed use       | A more delightful desktop         | Evidence that visitors notice the response  |
| P2       | Additional game evaluation                     | More play without more confusion  | A distinct, accessible interaction proposal |
| P3       | Any optional network service                   | Only evidence backed value        | Separate architecture and privacy review    |

## Explicit non-goals

- A pixel for pixel Windows 95 or 98 clone
- A fake terminal that makes visitors guess commands
- A long startup animation
- A public score leaderboard requiring accounts or moderation
- A CMS, database, or server solely to edit portfolio copy
- Auto playing audio or motion heavy ambient effects
- Adding libraries for effects already expressible with the existing CSS and platform stack
- Publishing generated `gh-pages` files back into `main`
