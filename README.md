# PatterOS

Connor Patterson's personal site, built as a small computer that is useful as well as playful. PatterOS opens with a concise introduction, remembers how you arrange it, reacts to the pointer, and keeps four familiar games in the arcade.

Live site: [connor-patterson.github.io](https://connor-patterson.github.io/)

## What is inside

- Eight useful desktop shortcuts in a compact three column cluster.
- A quieter first view with production results and project evidence available when a visitor wants the detail.
- Conventional minimize, maximize, and close controls, with sharing, size presets, and repositioning tucked into a window options menu.
- Snake, Memory Match, Tic Tac Toe, and Minesweeper.
- An interactive full stack system explorer and a live, read-only GitHub view.
- An interactive desktop field with pointer light, grid reveal, and click or tap signals.
- Direct case study pages and a printable evidence brief for interview loops.
- Day, night, high contrast, reduced motion, and responsive layouts from phone to wide desktop.
- Local fonts, scripts, styles, and images. The site needs no remote runtime or tracking service.

The design follows a lesson from standout personal sites: the medium should demonstrate the craft. Functional tools and polished interactions say more than decorative operating system mimicry, while deeper evidence should remain optional. PatterOS adapts that principle with its own visual system and implementation; it does not copy another portfolio's style.

## Stack

| Area                | Choice                                         | Why                                                                             |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Application         | Angular 22, standalone components, signals     | Typed structure, explicit state, and maintainable boundaries                    |
| Desktop interaction | Angular CDK and platform APIs                  | Drag, resize, local time, clipboard actions, downloads, and saved local state   |
| Visual system       | Custom SCSS, SVG icons, local fonts            | An original PatterOS language with no stock OS skin or network font request     |
| Arcade              | DOM native TypeScript                          | Familiar accessible games with pure rule engines in a lazy feature chunk        |
| Quality             | Vitest, Playwright, axe-core, ESLint, Prettier | Unit, viewport, accessibility, direct page, and static checks in one local gate |
| Publishing          | GitHub Pages from `gh-pages`                   | Free static hosting on the existing GitHub domain, with no custom workflow file |

The detailed boundaries and dependency rationale are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Local development

Prerequisites:

- A Node.js release supported by Angular 22
- npm; the repository records the intended npm version in `package.json`
- Git for publishing

Install the locked dependency graph and start the development server:

```bash
npm ci
npm start
```

The development site is served at `http://localhost:4200/`.

Run the complete local release gate:

```bash
npm run check
```

That gate checks formatting, lint, tests, the production GitHub Pages build, the published artifact contract, seven app viewports, the direct case pages, axe accessibility rules, and production dependency advisories.

Useful commands:

| Command                | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `npm start`            | Start the Angular development server       |
| `npm test`             | Run the test suite once                    |
| `npm run test:watch`   | Run tests in watch mode                    |
| `npm run lint`         | Run ESLint without changing files          |
| `npm run format`       | Format the repository with Prettier        |
| `npm run build:pages`  | Build for the root GitHub Pages address    |
| `npm run verify:pages` | Inspect the built Pages artifact           |
| `npm run smoke:pages`  | Run browser and accessibility smoke checks |
| `npm run check`        | Run the authoritative local release gate   |

## Manual GitHub Pages deployment

Publishing is intentionally local. There is no project-owned file under `.github/workflows/`.

1. Commit the source release to `main` and make sure the worktree is clean.
2. Run the local gate:

   ```bash
   npm run check
   ```

3. Preview the publish operation without changing the remote:

   ```bash
   npm run deploy:pages:dry
   ```

4. Publish the verified `dist/personal-website/browser` artifact:

   ```bash
   npm run deploy:pages
   ```

The pinned `angular-cli-ghpages` builder creates or replaces the generated `gh-pages` branch, includes `.nojekyll`, and does not create a `404.html`. Never hand-edit `gh-pages`; rebuild it from a reviewed `main` commit.

For the first deployment only, configure the repository at **Settings → Pages**:

- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/(root)**

GitHub internally records a Pages deployment run even for branch publishing. This repository owns no custom Actions workflow, and standard GitHub-hosted Actions use for this public repository is free.

### Why the URLs contain `#`

The production base is `/`, and Angular uses hash routing. A shareable route such as:

```text
https://connor-patterson.github.io/#/impact
```

requests the real root document from GitHub Pages with HTTP `200`; the fragment is then handled in the browser. This avoids an `index.html`-as-`404.html` workaround and its incorrect HTTP status.

## Repository map

```text
public/                      Résumé, case pages, evidence brief, metadata, and social assets
scripts/verify-pages.mjs     Post-build GitHub Pages contract
src/app/core/                Registry, routing bridge, window state, preferences
src/app/ui/                  Reusable desktop and window controls
src/app/features/            Portfolio, settings, and lazy arcade applications
docs/ARCHITECTURE.md         System boundaries and deployment design
docs/ROADMAP.md              Delivered lanes and deliberately gated followups
```

## Security and privacy

- The site is static and contains no server credentials or hidden API keys.
- Production dependencies are audited by `npm run audit:production`.
- Versions are exact and the lockfile is the installation authority.
- The Pages verifier rejects externally hosted runtime scripts and styles.
- There is no analytics, advertising, tracking pixel, or third party contact form in the launch architecture.
- All professional examples must remain sanitized and suitable for public disclosure.

## What stays deliberately small

The site has no account system, analytics, database, contact relay, public leaderboard, or custom GitHub workflow. Those are not missing pieces. Each would need a clear user benefit, a privacy plan, and a zero dollar operating path before it belongs here. The decision record lives in [docs/ROADMAP.md](docs/ROADMAP.md).
