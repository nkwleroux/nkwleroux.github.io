# PEN - Portfolio Expedition: Nicholas

**Version: 1.0**

PEN is Nicholas Le Roux's engineering portfolio. It provides two complementary ways to explore the same work: a conventional resume for fast review and an interactive network map for deeper exploration.

## Core features

- Conventional interactive resume at `resume.html`
- Printable resume at `/resume.pdf`
- Static no-JavaScript resume at `nojs.html`
- Interactive 3600 x 2200 engineering network
- Network and chronological Timeline views
- Mission directory and guided 60-second tour
- Keyboard navigation and command palette
- English, Dutch, and Spanish localization
- Light and dark themes
- Performance Mode for lower-motion/lower-cost rendering
- Accessibility Mode with larger text, stronger contrast, visible focus states, keyboard-first navigation, skip links, and a simplified map
- Stable semantic pages for professional work, projects, education, skills, profile, and contact

## Requirements

- Node.js 20.19 or newer
- npm

## Install

```cmd
npm install
```

## Local development

```cmd
npm run dev
```

On Windows:

```cmd
tools\dev.cmd
```

Vite normally serves the development site at `http://127.0.0.1:5173/`.

## Production build

```cmd
npm run build
```

On Windows:

```cmd
tools\build.cmd
```

The build type-checks the TypeScript source and writes the production site to `dist/`.

## Production preview

```cmd
npm run preview
```

On Windows:

```cmd
tools\preview.cmd
```

Preview performs a production build and normally serves it at `http://127.0.0.1:4173/`.

## Visitor paths

### Resume

`resume.html` is the fastest route through the portfolio. It contains the engineering profile, professional highlights, featured engineering work, IFSF Engineering Bulletins, career history, project archive, skills, education, and contact information.

### Network Expedition

The interactive map organizes the portfolio into five areas:

- Profile
- Professional Career
  - Haia Consultancy
  - ILAC
  - IFSF Publications
  - Axians
- Project Constellation
  - Networked Applications
  - Embedded & Physical Computing
  - Application Systems
  - Vision / Machine Learning
  - Quantitative Research
- Academic + Capability
  - Education
  - Engineering Capabilities
- Contact

The same mission nodes can be viewed as an orbital network or as a chronological timeline.

## Network controls

- `W`, `A`, `S`, `D` move the user packet; two direction keys can be held together for diagonal movement
- `Tab` / `Shift+Tab` move keyboard focus; focusing a mission centers the mission and user packet
- Arrow keys move through menus and mission lists
- `Enter` / `Space` activate focused controls and nodes
- `Home` / `End` jump to the first or last mission in the Missions directory
- `Escape` closes the active foreground panel
- `/`, `Ctrl+K`, or `Cmd+K` open the command palette
- Pointer drag pans the map
- Scroll/trackpad zooms on fine-pointer devices
- `+`, `FIT`, and `-` provide explicit map zoom controls

## Settings

### Performance Mode

Performance Mode reduces decorative work while preserving navigation and content. It disables orbit markers and other nonessential visual effects and limits expensive motion.

### Accessibility Mode

Accessibility Mode changes the presentation without removing content. It increases text size and contrast, strengthens focus indicators, reduces motion, prioritizes keyboard navigation, exposes skip navigation, and simplifies the map background.

## Deep links

The network accepts query parameters for direct navigation. Examples:

```text
/network?mission=ilac
/network?skill=cpp
```

Mission links focus and open a matching network node. Skill links open the capability evidence view.

## Semantic routes

Important content also has conventional, shareable pages:

```text
/profile/
/work/haia/
/work/haia/ilac/
/experience/axians/
/projects/networked/
/projects/embedded-lab/
/projects/applications-lab/
/projects/vision-ml/
/projects/quant-research/
/education/
/education/avans/
/education/yonsei/
/skills/
/contact/
```

## Professional source grounding

Professional IFSF and ILAC claims are aligned with the technical standards and engineering bulletins used in the work, including:

- IFSF Part 2-01 Communications over LonWorks v1.93
- IFSF Part 3-02 Price Pole Application v1.24
- IFSF Engineering Bulletin No. 11 v1.06
- OpenRetailing Price Pole API Collections v1.0
- IFSF Engineering Bulletin No. 26
- IFSF Engineering Bulletin No. 27

The portfolio summarizes the engineering scope and documented contribution without bundling copyrighted standards into the public site.

## Project structure

```text
PEN/
|-- src/
|   |-- app/          Application orchestration
|   |-- animations/   Motion helpers
|   |-- config/       Site configuration
|   |-- controllers/  World, panels, overlays, settings, command palette
|   |-- core/         DOM, math, media, theme, language, preferences
|   |-- data/         Portfolio, project, route, timeline, and tour data
|   |-- domain/       Shared TypeScript types
|   |-- i18n/         English, Dutch, and Spanish resources
|   |-- render/       HTML renderers
|   |-- state/        Expedition/session state
|   `-- styles/       Network, resume, route, overlay, and responsive styles
|-- work/             Professional semantic routes
|-- experience/       Experience semantic routes
|-- projects/         Project semantic routes
|-- education/        Education semantic routes
|-- skills/           Capabilities route
|-- contact/          Contact route
|-- profile/          Profile route
|-- public/           Static assets and resume PDF
|-- tools/            Development/build helpers
|-- index.html        Landing page and interactive network
|-- network/          Direct network entry
|-- resume.html       Interactive resume
|-- nojs.html         Static resume fallback
|-- 404.html          Recovery page
|-- ARCHITECTURE.md
|-- package.json
`-- vite.config.ts
```
