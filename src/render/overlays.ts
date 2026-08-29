import { siteConfig } from "../config/site.js";
import { categoryHubs, mapBounds, portfolioNodes } from "../data/portfolio.js";
import { renderLayerIcons } from "./layerIcons.js";

export const renderDetailPanel = (): string => `
  <section class="detail-panel" id="detail-panel" aria-live="polite" aria-label="Selected mission details" aria-hidden="true" inert>
    <button class="panel-close" id="panel-close" type="button" aria-label="Close details">×</button>
    <div class="panel-progress"><i id="panel-progress"></i></div>
    <div id="panel-content"></div>
  </section>`;

export const renderProximity = (): string => `
  <aside class="proximity" id="proximity" aria-live="polite"><span>PROXIMITY</span><b id="proximity-name">NONE</b><small>PRESS ENTER TO VIEW DETAILS</small></aside>`;

export const renderMinimap = (): string => {
  const missionPoints = portfolioNodes
    .map((node) => {
      const left = ((node.position.x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * 100;
      const top = ((node.position.y - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * 100;
      return `<i class="mini-node ${node.sector === "interface" ? "bridge" : ""}" style="left:${left}%;top:${top}%"></i>`;
    })
    .join("");

  const hubPoints = categoryHubs
    .filter((hub) => !hub.mergedMissionId)
    .map((hub) => {
      const left = ((hub.position.x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * 100;
      const top = ((hub.position.y - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * 100;
      return `<i class="mini-hub" style="left:${left}%;top:${top}%"></i>`;
    })
    .join("");

  const destinationOptions = portfolioNodes
    .map((node) => `<option value="${node.id}">${node.index} // ${node.title}</option>`)
    .join("");

  return `<div class="minimap-dock" id="minimap-dock">
    <div class="minimap" id="minimap" aria-hidden="true" inert>
      <div class="mini-map-inner">${missionPoints}${hubPoints}<span id="mini-dot"></span></div>
      <div class="mobile-map-select-wrap">
        <label for="mobile-map-select">SELECT DESTINATION</label>
        <select id="mobile-map-select" aria-label="Select a PEN network destination">
          <option value="">MISSION / NODE</option>
          ${destinationOptions}
        </select>
      </div>
      <div class="minimap-label"><span>PEN NETWORK MAP / CAREER MAP</span><b id="map-sector">SECTOR A</b></div>
    </div>
    <div class="map-zoom-controls" role="group" aria-label="Map zoom controls">
      <button class="map-zoom-button" id="map-zoom-in" type="button" aria-label="Zoom in">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      </button>
      <button class="map-zoom-fit" id="map-zoom-fit" type="button" aria-label="Fit the complete map in view">
        <span id="map-zoom-value" data-i18n-skip>100%</span>
        <small>FIT</small>
      </button>
      <button class="map-zoom-button" id="map-zoom-out" type="button" aria-label="Zoom out">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
      </button>
    </div>
    <button class="minimap-toggle" id="minimap-toggle" type="button" aria-expanded="false" aria-controls="minimap" aria-label="Expand network map">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.2 9 3.5l6 2.8 5.5-2.7v14.2L15 20.5l-6-2.8-5.5 2.7V6.2Z"/><path d="M9 3.5v14.2M15 6.3v14.2"/></svg>
    </button>
  </div>`;
};

const layerValue = (text: string, icons: readonly string[]): string =>
  `<b class="layer-text-value">${text}</b>${renderLayerIcons(icons)}`;

const layerArticle = (
  label: string,
  value: string,
  description: string,
  icons: readonly string[],
): string => `
  <article>
    <span>${label}</span>
    ${layerValue(value, icons)}
    <small>${description}</small>
  </article>`;

export const renderLayerInspector = (): string => `
  <section class="layer-inspector" id="layer-inspector" aria-label="Dual stack layer inspector" aria-hidden="true" inert>
    <div class="layer-shell" id="layer-shell">
      <header class="layer-header">
        <div>
          <span>PEN / LAYERS — SKILLS & TECHNOLOGIES</span>
          <b>SCROLL THE FULL SYSTEM MAP / DRAG THE PHYSICAL ↔ APPLICATION BOUNDARY</b>
        </div>
        <div class="layer-header-actions">
          <button class="layer-view-toggle" id="layer-view-toggle" type="button" aria-pressed="false">VIEW: ICONS</button>
          <button id="layers-close" type="button" aria-label="Close layer inspector">×</button>
        </div>
      </header>

      <div class="layer-scroll" id="layer-scroll" tabindex="0" aria-label="Physical and application engineering systems">
        <div class="layer-content">
          <section class="physical-layer" aria-label="Physical and operational technology layer">
            <div class="layer-code">01 / PHYSICAL + OT</div>
            <div class="layer-title"><span>HARDWARE</span><br>+ PROTOCOLS</div>
            <p>Work close to the machine: firmware, field buses, industrial networks, binary representations, peripherals, and hardware/software debugging.</p>
            <div class="layer-grid">
              ${layerArticle("LANGUAGES", "C / C++", "Embedded, systems, IoT, protocol, and graphics work", ["C", "C++"])}
              ${layerArticle("DEVICES", "ESP32 / STM32 / Arduino / Pico / ATtiny85", "Firmware, sensors, controls, and hardware integration", ["ESP32", "STM32", "Arduino", "Pico", "ATtiny85"])}
              ${layerArticle("BUSES", "I²C / SMBus / TP/FT-10", "Peripheral and industrial physical communication", ["I²C", "SMBus", "TP/FT-10"])}
              ${layerArticle("INDUSTRIAL", "IFSF / LonWorks / LonTalk", "Forecourt technology, Price Poles, operational technology", ["IFSF", "LonWorks", "LonTalk"])}
              ${layerArticle("LOW LEVEL", "Binary / bitfields / BCD", "bin8, bcd6, bcd8, framing, parsing, serialization", ["Binary", "bitfields", "BCD"])}
              ${layerArticle("PERIPHERALS", "LCD / buzzer / touch / rotary", "Connected embedded-system integration", ["LCD", "buzzer", "touch", "rotary"])}
              ${layerArticle("DEBUGGING", "Hardware ↔ Network ↔ Software", "Communication tracing across physical and protocol boundaries", ["Hardware", "Network", "Software"])}
              ${layerArticle("TOOLCHAIN", "CMake / Ninja / GCC / MinGW", "MINGW32, C++11, 32-bit Windows", ["CMake", "Ninja", "GCC", "MinGW"])}
            </div>
          </section>

          <section class="application-layer" aria-label="Application and software layer">
            <div class="layer-code">02 / APPLICATION + SOFTWARE</div>
            <div class="layer-title"><span>APIS</span><br>+ APPLICATIONS</div>
            <p>Expose, control, analyse, and visualize systems through APIs, networking, desktop/mobile clients, data tooling, cloud infrastructure, and observability.</p>
            <div class="layer-grid">
              ${layerArticle("BACKEND", "C# / ASP.NET Core / Oat++", "REST APIs, HTTP, JSON, services, protocol conversion", ["C#", "ASP.NET Core", "Oat++"])}
              ${layerArticle("NETWORKING", "TCP/IP / sockets / MQTT", "Client/server, distributed state, device/backend communication", ["TCP/IP", "sockets", "MQTT"])}
              ${layerArticle("DESKTOP", "WPF / JavaFX", "GUI applications, simulations, networked desktop systems", ["WPF", "JavaFX"])}
              ${layerArticle("WEB", "JavaScript / TypeScript", "Frontend applications and full-stack integration", ["JavaScript", "TypeScript"])}
              ${layerArticle("MOBILE", "Android / Kotlin / Java", "Backend and hardware/mobile integration", ["Android", "Kotlin", "Java"])}
              ${layerArticle("DATA + ML", "Python / TensorFlow / Jupyter", "Quantitative analysis, research replication, computer vision", ["Python", "TensorFlow", "Jupyter"])}
              ${layerArticle("DATA", "PostgreSQL / MySQL / MariaDB / SQLite", "Relational persistence, CRUD, data modelling", ["PostgreSQL", "MySQL", "MariaDB", "SQLite"])}
              ${layerArticle("PLATFORM", "Azure / AWS / Docker", "Docker Compose, VMs, portable local/cloud deployment", ["Azure", "AWS", "Docker"])}
              ${layerArticle("OBSERVABILITY", "Prometheus / Grafana", "Metrics, monitoring, operational visibility", ["Prometheus", "Grafana"])}
              ${layerArticle("GRAPHICS", "OpenGL / 3D / 2.5D", "Interactive systems, games, visual input", ["OpenGL", "3D", "2.5D"])}
            </div>
          </section>
        </div>
      </div>

      <div
        class="layer-divider"
        id="layer-divider"
        aria-label="Drag to resize engineering layers"
        role="separator"
        aria-orientation="vertical"
        aria-valuemin="20"
        aria-valuemax="80"
        aria-valuenow="50"
        tabindex="0"
      ><i></i><span>NICHOLAS<br>SYSTEMS BRIDGE</span></div>

      <div class="layer-footer">
        <span>FIELD / PHYSICAL / OT</span>
        <strong>← ONE ENGINEERING RANGE →</strong>
        <span>API / DATA / APPLICATION</span>
      </div>
    </div>
  </section>`;

export const renderHelp = (): string => `
  <section class="help-modal" id="help-modal" aria-label="Network controls" aria-hidden="true" inert>
    <div class="help-card">
      <button id="help-close" type="button" aria-label="Close controls">×</button>
      <span>NETWORK HELP / CURRENT CONTROLS</span>
      <h2>EXPLORE THE SYSTEM.</h2>

      <section class="help-section" aria-labelledby="help-options-title">
        <h3 id="help-options-title">AVAILABLE OPTIONS</h3>
        <div class="help-grid">
          <div><b>THEME / LANGUAGE</b><p>Use the light/dark controls and EN, ES, or NL selector at the left side of the header.</p></div>
          <div><b>RESUME</b><p>Open the conventional resume view. Returning to PEN restores your expedition position and open mission.</p></div>
          <div><b>VIEW: TIMELINE / NETWORK</b><p>Switch the same mission nodes between the orbital network and the chronological Expedition Log.</p></div>
          <div><b>MISSIONS</b><p>Open the grouped mission directory and jump directly to any project, experience, education, capability, profile, or contact node.</p></div>
          <div><b>60 SEC TOUR</b><p>Run the guided nine-stop route through Profile, Haia, ILAC, IFSF Bulletins, Axians, networked applications, physical computing, Capabilities, and Contact.</p></div>
          <div><b>CONTACT</b><p>Open the contact panel for availability, email, GitHub, LinkedIn, and the full resume contact section.</p></div>
          <div><b>SETTINGS</b><p>Open Performance Mode or Accessibility Mode. Performance Mode reduces decorative rendering while preserving navigation and panels. Accessibility Mode changes presentation only: every mission, panel, and control remains available while text and contrast increase, focus indicators become more visible, motion is reduced, keyboard navigation is prioritized, and the map is simplified.</p></div>
          <div><b>MAP</b><p>Use the bottom-right map button to expand or collapse the live PEN minimap.</p></div>
          <div><b>ZOOM + / FIT / −</b><p>Use the bottom-right zoom controls to change map scale or fit the complete authored world into view.</p></div>
          <div><b>WORLD NODES / CATEGORY HUBS</b><p>Mission orbs and category hubs in the world view are interactive. Select one to center it and open the corresponding information.</p></div>
          <div><b>MOBILE MENU</b><p>On touch devices, the burger menu contains Timeline, 60 Sec Tour, Contact, Settings, and Help. Resume and Missions remain available in the header.</p></div>
        </div>
      </section>

      <section class="help-section help-controls-section" aria-labelledby="help-controls-title">
        <h3 id="help-controls-title">KEYBOARD &amp; MAP CONTROLS</h3>
        <div class="help-grid">
          <div><b>W / A / S / D</b><p>Move the data packet through the world view and immediately take control back from autopilot. Hold two direction keys together (W+A, W+D, S+A, or S+D) to move diagonally.</p></div>
          <div><b>ARROW KEYS</b><p>Move focus through header and mobile-menu controls. In Missions, use Up and Down to move through the mission list.</p></div>
          <div><b>ENTER / SPACE</b><p>Activate a focused button or map node. With focus in the world, Enter opens the current inspection target.</p></div>
          <div><b>HOME / END</b><p>While the Missions directory is focused, jump to the first or last mission.</p></div>
          <div><b>TAB / SHIFT+TAB</b><p>Move keyboard focus through controls, links, map nodes, and panel actions. When a mission orb receives focus, the user packet moves to that orb and both are centered in the map.</p></div>
          <div><b>/ OR CTRL+K</b><p>Open the command palette for direct navigation, resume access, C++ project filtering, contact, language switching, map fitting, and Settings.</p></div>
          <div><b>ESC</b><p>Close the active panel, overlay, minimap, tour, or mobile menu and return focus to the world.</p></div>
          <div><b>CLICK / TAP</b><p>Select a mission orb or category hub to open it. On touch devices the same world nodes use enlarged hit areas.</p></div>
          <div><b>DRAG MAP</b><p>Drag empty map space to pan the camera without moving the data packet. Releasing returns the camera to the packet-bounded view.</p></div>
          <div><b>SCROLL / TRACKPAD</b><p>Zoom the desktop map in or out. Ctrl or Command plus scroll remains reserved for normal browser zoom.</p></div>
        </div>
      </section>
    </div>
  </section>`;

export const renderContactPanel = (): string => `
  <section class="contact-modal" id="contact-modal" aria-label="Contact Nicholas Le Roux" aria-hidden="true" inert>
    <div class="contact-panel-card">
      <button id="contact-close" type="button" aria-label="Close contact panel">×</button>
      <span>CONTACT / OPEN CHANNEL</span>
      <h2>OPEN A DIRECT CHANNEL.</h2>
      <p class="contact-panel-intro">Discuss embedded systems, industrial communication, IoT, networking, backend engineering, or software that connects applications to the physical world.</p>
      <section class="contact-status-card" aria-label="Current availability">
        <div><span>CURRENTLY</span><b>Embedded Software Engineer · Rotterdam, Netherlands</b></div>
        <div><span>INTERESTED IN</span><b>Remote positions · Part-time · Full-stack development · Web development · Frontend/backend development · Cloud engineering · Embedded · Systems · IoT · Networking · Platform Engineering</b></div>
      </section>
      <div class="contact-panel-grid">
        <article><span>EMAIL</span><b>${siteConfig.email}</b><a href="mailto:${siteConfig.email}">SEND EMAIL ↗</a></article>
        <article><span>GITHUB</span><b>nkwleroux</b><a href="${siteConfig.githubUrl}" target="_blank" rel="noopener noreferrer">OPEN GITHUB ↗</a></article>
        <article><span>LINKEDIN</span><b>Nicholas Le Roux</b><a href="${siteConfig.linkedInUrl}" target="_blank" rel="noopener noreferrer">OPEN LINKEDIN ↗</a></article>
        <article><span>CONTACT FORM</span><b>Full message form in the resume</b><a class="contact-resume-link" href="/resume.html#contact">OPEN CONTACT SECTION IN RESUME ↗</a></article>
      </div>
    </div>
  </section>`;

export const renderSettings = (): string => `
  <section class="settings-modal" id="settings-modal" aria-label="Portfolio settings" aria-hidden="true" inert>
    <div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button id="settings-close" type="button" aria-label="Close settings">×</button>
      <span>SETTINGS / DISPLAY &amp; ACCESSIBILITY</span>
      <h2 id="settings-title">TUNE THE EXPERIENCE.</h2>
      <p class="settings-intro">Choose a lighter rendering path or a higher-accessibility presentation. Preferences are saved on this device.</p>
      <div class="settings-options">
        <label class="settings-option" for="performance-mode-toggle">
          <span><b>PERFORMANCE MODE</b><small>LOW MOTION / LOWER GPU LOAD</small></span>
          <input id="performance-mode-toggle" type="checkbox" role="switch" aria-describedby="performance-mode-copy" />
          <i aria-hidden="true"></i>
          <p id="performance-mode-copy">Disables orbit markers, long transitions, decorative depth effects, and other nonessential motion while keeping the map structure intact.</p>
        </label>
        <label class="settings-option" for="accessibility-mode-toggle">
          <span><b>ACCESSIBILITY MODE</b><small>READABILITY / KEYBOARD / SIMPLE MAP</small></span>
          <input id="accessibility-mode-toggle" type="checkbox" role="switch" aria-describedby="accessibility-mode-copy" />
          <i aria-hidden="true"></i>
          <p id="accessibility-mode-copy">Changes presentation only. Every mission, panel, and control remains available while using larger text, stronger contrast, persistent focus indicators, reduced motion, keyboard-first navigation, a skip link, and a simplified map.</p>
        </label>
      </div>
      <div class="settings-status" id="settings-status" aria-live="polite"></div>
    </div>
  </section>`;

export const renderCommandPalette = (): string => `
  <section class="command-palette" id="command-palette" aria-hidden="true" inert>
    <div class="command-palette-card" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
      <div class="command-palette-head">
        <span id="command-palette-title">PEN / COMMAND PALETTE</span>
        <kbd>ESC</kbd>
      </div>
      <label class="command-search-shell">
        <span aria-hidden="true">&gt;</span>
        <input id="command-palette-input" type="text" autocomplete="off" spellcheck="false" placeholder="Type a command..." aria-controls="command-palette-list" />
      </label>
      <div class="command-palette-list" id="command-palette-list" role="listbox" aria-label="Available commands"></div>
      <div class="command-palette-footer"><span>↑ ↓ SELECT</span><span>ENTER RUN</span><span>/ OR CTRL+K OPEN</span></div>
    </div>
  </section>`;
