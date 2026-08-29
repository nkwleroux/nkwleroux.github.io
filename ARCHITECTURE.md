# PEN Architecture

**Version: 1.0**

PEN is a static multi-page TypeScript portfolio built with Vite. Portfolio content is separated from presentation so the same engineering evidence can be exposed through a conventional resume, semantic pages, and the interactive network.

## Architectural goals

1. Keep important content understandable without learning the network controls.
2. Keep professional work and projects accessible through semantic HTML and stable URLs.
3. Preserve one authored world model across desktop and touch-first devices.
4. Keep navigation, accessibility, localization, and display preferences consistent across routes.
5. Avoid a permanent full-world render loop and limit animation work to active interactions.
6. Keep portfolio content static so the site can be built and hosted as static files.

## Information architecture

```text
HOME / PEN
|-- Resume
|-- Network Expedition
|   |-- Profile
|   |-- Professional Career
|   |   |-- Haia Consultancy
|   |   |   |-- ILAC
|   |   |   `-- IFSF Publications
|   |   `-- Axians
|   |-- Project Constellation
|   |   |-- Networked Applications
|   |   |-- Embedded & Physical Computing
|   |   |-- Application Systems
|   |   |-- Vision / Machine Learning
|   |   `-- Quantitative Research
|   |-- Academic + Capability
|   |   |-- Education
|   |   `-- Engineering Capabilities
|   `-- Contact
|
|-- Semantic Routes
|   |-- /profile/
|   |-- /work/*
|   |-- /experience/*
|   |-- /projects/*
|   |-- /education/*
|   |-- /skills/
|   `-- /contact/
|
|-- resume.html
|-- nojs.html
`-- /resume.pdf
```

## Build entry points

Vite builds the main application and the semantic pages as independent HTML entry points:

- `index.html` - landing page and interactive network
- `network/index.html` - direct network entry
- `resume.html` - conventional interactive resume
- `nojs.html` - static resume fallback
- `404.html` - recovery page
- `profile/index.html`
- professional routes under `work/` and `experience/`
- project routes under `projects/`
- education routes under `education/`
- `skills/index.html`
- `contact/index.html`
- `public/resume.pdf`

## Application composition

`src/main.ts` initializes the interactive application. `PortfolioApp` coordinates the primary controllers and shared state.

Key layers are:

- **Data:** portfolio nodes, projects, timeline data, route metadata, project presentation metadata, and tour content
- **State:** current packet position, selected mission, navigation state, and session restoration
- **Controllers:** map movement, panels, overlays, settings, command palette, case studies, traces, and layout mode
- **Renderers:** world map, HUD, mission directory, detail blocks, overlays, and application shell
- **Core services:** DOM helpers, theme, localization, experience settings, media queries, and math utilities

## World model

The network uses a fixed authored coordinate space of 3600 x 2200. Mission nodes and category hubs have stable world-space coordinates.

`WorldController` owns:

- user-packet position
- world transform and scale
- camera pan
- minimap coordinates
- keyboard movement
- pointer dragging
- zoom input
- finite camera/packet travel
- orbit-marker timing

The minimum scale is derived from the viewport so the full authored world can be fitted into view. The maximum scale preserves the intended close-up map presentation.

## Network and Timeline layouts

`WorldLayoutController` switches the same mission nodes between two coordinate sets:

- **Network:** authored category/hub layout
- **Timeline:** chronological lanes for professional work, education, academic projects, capabilities, and contact

Changing display preferences or viewport geometry re-applies the active layout so Timeline coordinates remain authoritative while Timeline mode is selected.

## Keyboard focus and packet movement

Mission orbs are keyboard-focusable buttons. When keyboard focus reaches a mission orb, the user packet moves to that mission and the camera centers the packet and focused node together.

Manual `W`, `A`, `S`, `D` input returns control to the packet-driven camera. The movement state tracks simultaneous keys, allowing normalized diagonal movement without increasing speed.

## Panels and overlays

Mission detail panels, Missions, Help, Contact, Settings, the command palette, the minimap, case studies, and signal traces are foreground surfaces managed by controllers.

Hidden interactive surfaces use `inert` together with `aria-hidden`. Focus is moved to a visible target before a surface is hidden, preventing focused descendants from remaining inside content removed from the accessibility tree.

## Settings

`src/core/experienceSettings.ts` stores persistent display preferences and applies document-level classes.

### Performance Mode

Performance Mode reduces decorative rendering and nonessential motion while keeping mission nodes, panels, navigation, and map layout available. The orbit-marker animation loop is stopped while this mode is active.

### Accessibility Mode

Accessibility Mode enables a simplified presentation with larger text, stronger contrast, visible focus indicators, reduced motion, keyboard-first navigation, skip navigation, and a simplified map background. Mission and panel functionality remains available.

System `prefers-reduced-motion` is respected independently of the portfolio settings.

## Guided tour

The 60-second tour is defined as an ordered list of mission IDs with concise summaries. Camera travel and panel dwell time are separate concerns: display settings may reduce travel animation, but the reading interval remains available for each stop.

Opening Settings during the tour pauses the active stop. The application stores the current stop, travel/dwell phase, and remaining dwell time and resumes from that state when Settings closes.

## Deep links

The network accepts direct query parameters:

```text
/network?mission=ilac
/network?skill=cpp
```

`PortfolioApp` resolves valid mission IDs against the live portfolio node data. Skill links enter the capability view. Mission selection also updates browser history so a network state can be copied and revisited.

## Resume architecture

The portfolio exposes three resume paths:

1. `resume.html` - interactive conventional resume
2. `/resume.pdf` - printable resume
3. `nojs.html` - static HTML fallback

The resume uses the same portfolio data for major professional evidence and project content where appropriate. The project archive is rendered from `src/data/projects.ts`.

## Project evidence model

`src/data/projectPresentation.ts` supplies scan-first metadata for major work:

```text
ROLE | TEAM | PERIOD
STATUS | IMPACT
```

This metadata is used in major resume sections, mission panels, and semantic case-study routes. Detailed content remains in the portfolio node and case-study data.

## Localization

`src/i18n/` contains English, Dutch, and Spanish resources. `src/core/language.ts` applies stored language preferences across the network, resume, recovery page, and semantic routes.

Technical names, protocol names, library names, and code identifiers remain unchanged when translation would reduce accuracy.

## Theme

Theme preference is stored locally and applied across the network, resume, recovery page, and semantic routes. The authored world uses stable rendering tokens while interface surfaces adapt to the active light or dark theme.

## Runtime performance model

There is no permanent full-world animation loop. Animation frames are requested for active work such as:

- keyboard movement
- finite camera/packet travel
- coalesced pointer drag
- coalesced wheel zoom
- the shared orbit-marker loop when enabled

The map uses a pre-rendered WebP nebula, a static constellation SVG, compositor transforms for movement, and a single shared orbit-marker loop rather than independent per-node animations.

## Source layout

`src/` contains:

- `app/` - application orchestration and navigation routing
- `animations/` - motion abstractions and reveal helpers
- `config/` - site configuration
- `controllers/` - world, panel, overlay, settings, command-palette, trace, and case-study behavior
- `core/` - DOM, math, media, theme, language, and experience settings
- `data/` - portfolio content, project archive, project presentation, routes, timeline, and tour content
- `domain/` - shared TypeScript types
- `i18n/` - localization resources
- `render/` - application and page renderers
- `state/` - expedition/session state
- `styles/` - network, panels, overlays, preferences, routes, responsive, and resume styles

## Tooling

`tools/portfolio.mjs` exposes:

- `dev`
- `typecheck`
- `build`
- `preview`

The `.cmd` files provide Windows launchers for the same tasks.
