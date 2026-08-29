import { categoryHubs, mapBounds, networkRoutes, portfolioNodes, worldSize } from "../data/portfolio.js";
import { timelineLanes, timelineMarkers, timelinePeriods } from "../data/experience.js";
import { renderConstellationField } from "./constellation.js";

const statusClass = (tone: string): string =>
  tone === "live" ? "status-live" : tone === "build" ? "status-build" : "";

const orbitSeed = (value: string): number =>
  Array.from(value).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 3), 0);


const renderCelestialOrnaments = (): string => `
  <svg class="celestial-ornaments" width="${worldSize.width}" height="${worldSize.height}" viewBox="0 0 ${worldSize.width} ${worldSize.height}" aria-hidden="true">
    <g class="celestial-system tone-cyan" transform="translate(285 365)">
      <circle class="celestial-halo" r="152"/>
      <ellipse class="celestial-ring" rx="132" ry="58" transform="rotate(-18)"/>
      <ellipse class="celestial-ring secondary" rx="86" ry="38" transform="rotate(28)"/>
      <circle class="celestial-core" r="15"/><circle class="celestial-body" cx="102" cy="-35" r="6"/><circle class="celestial-body minor" cx="-61" cy="31" r="4"/>
    </g>
    <g class="celestial-system tone-violet" transform="translate(1740 270)">
      <circle class="celestial-halo" r="116"/>
      <ellipse class="celestial-ring" rx="104" ry="43" transform="rotate(14)"/>
      <ellipse class="celestial-ring secondary" rx="68" ry="27" transform="rotate(-37)"/>
      <circle class="celestial-core" r="11"/><circle class="celestial-body" cx="82" cy="24" r="5"/><circle class="celestial-body minor" cx="-42" cy="-31" r="3.5"/>
    </g>
    <g class="celestial-system tone-lime" transform="translate(3260 420)">
      <circle class="celestial-halo" r="168"/>
      <ellipse class="celestial-ring" rx="142" ry="61" transform="rotate(23)"/>
      <ellipse class="celestial-ring secondary" rx="94" ry="42" transform="rotate(-21)"/>
      <circle class="celestial-core" r="14"/><circle class="celestial-body" cx="118" cy="41" r="6"/><circle class="celestial-body minor" cx="-72" cy="-36" r="4"/>
    </g>
    <g class="celestial-system tone-lime" transform="translate(470 1840)">
      <circle class="celestial-halo" r="134"/>
      <ellipse class="celestial-ring" rx="116" ry="49" transform="rotate(-26)"/>
      <ellipse class="celestial-ring secondary" rx="74" ry="31" transform="rotate(32)"/>
      <circle class="celestial-core" r="12"/><circle class="celestial-body" cx="88" cy="-28" r="5"/><circle class="celestial-body minor" cx="-51" cy="37" r="3.5"/>
    </g>
    <g class="celestial-system tone-cyan" transform="translate(1800 1980)">
      <circle class="celestial-halo" r="104"/>
      <ellipse class="celestial-ring" rx="92" ry="37" transform="rotate(9)"/>
      <ellipse class="celestial-ring secondary" rx="57" ry="24" transform="rotate(-43)"/>
      <circle class="celestial-core" r="9"/><circle class="celestial-body" cx="73" cy="17" r="4.5"/><circle class="celestial-body minor" cx="-34" cy="-27" r="3"/>
    </g>
    <g class="celestial-system tone-violet" transform="translate(3160 1810)">
      <circle class="celestial-halo" r="146"/>
      <ellipse class="celestial-ring" rx="126" ry="54" transform="rotate(31)"/>
      <ellipse class="celestial-ring secondary" rx="80" ry="34" transform="rotate(-15)"/>
      <circle class="celestial-core" r="13"/><circle class="celestial-body" cx="98" cy="48" r="5.5"/><circle class="celestial-body minor" cx="-63" cy="-25" r="3.5"/>
    </g>
    <g class="celestial-dust tone-cyan">
      ${[
        [155, 670, 2.2], [240, 720, 1.3], [345, 640, 1.6], [880, 250, 1.8], [1010, 330, 1.2],
        [2060, 260, 1.5], [2200, 360, 2.1], [3410, 760, 1.4], [3300, 880, 1.9], [3460, 950, 1.1],
        [210, 1570, 1.5], [315, 1510, 2.0], [925, 1930, 1.2], [1120, 2010, 1.7], [2350, 1950, 2.0],
        [2510, 2040, 1.2], [3370, 1520, 1.8], [3440, 1660, 1.3],
      ].map(([x, y, radius]) => `<circle cx="${x}" cy="${y}" r="${radius}"/>`).join("")}
    </g>
  </svg>`;

export const renderWorld = (): string => {
  const routes = networkRoutes
    .map(
      (route) => `<path
        class="route category-route"
        data-route="${route.id}"
        data-route-from="${route.from}"
        data-route-to="${route.to}"
        d="${route.path}"
      />`,
    )
    .join("");

  const categoryHubMarkup = categoryHubs
    .map((hub) => {
      if (hub.mergedMissionId) return "";

      return `
        <button
          class="category-hub group-${hub.id}"
          data-category-hub="${hub.id}"
          data-category-group="${hub.id}"
          style="--hub-x:${hub.position.x}px;--hub-y:${hub.position.y}px"
          type="button"
          aria-label="Travel to ${hub.label} category hub"
          title="${hub.label}"
        >
          <span class="orb-hit-target" aria-hidden="true"></span>
          <span class="category-hub-kicker">CATEGORY HUB</span>
          <b>${hub.label}</b>
          <small>${hub.subtitle}</small>
          <i></i>
        </button>`;
    })
    .join("");

  const missionOrbits = portfolioNodes
    .map((node) => {
      const hub = categoryHubs.find((candidate) => candidate.id === node.missionGroup);
      if (!hub) return "";

      // Each mission uses the category hub as its solar-system centre. Keeping
      // all tracks hub-centred avoids nested paths crossing category controls.
      const selfOrbit = hub.mergedMissionId === node.id;
      const parentPosition = hub.position;
      const dx = node.position.x - parentPosition.x;
      const dy = node.position.y - parentPosition.y;
      const seed = orbitSeed(node.id);
      const missionDistance = Math.hypot(dx, dy);
      const hubClearance = selfOrbit ? 184 : 164;
      const radiusX = selfOrbit
        ? 208 + (seed % 31)
        : Math.max(hubClearance + 12, Math.round(missionDistance));
      const squashRatios = [0.52, 0.59, 0.66, 0.73, 0.81, 0.89, 0.95] as const;
      const squash = squashRatios[seed % squashRatios.length] ?? 0.73;
      const radiusY = Math.max(
        hubClearance,
        Math.min(radiusX - 10, Math.round(radiusX * squash)),
      );
      const orbitWidth = radiusX * 2;
      const orbitHeight = radiusY * 2;
      const angle = selfOrbit
        ? -24 + (seed % 49)
        : Math.atan2(dy, dx) * (180 / Math.PI);
      const styleVariant = seed % 4;
      const markerSpeed = 34 + (seed % 7) * 2.4;
      const phase = (seed % 13) * 0.43;
      const reverse = seed % 2 !== 0;
      const directionClass = reverse ? "orbit-reverse" : "";
      const selfClass = selfOrbit ? "mission-orbit-self" : "";

      return `<div
        class="mission-orbit orbit-style-${styleVariant} orbit-${node.id} ${directionClass} ${selfClass}"
        data-mission-orbit="${node.id}"
        data-mission-group="${node.missionGroup}"
        data-orbit-parent="${hub.id}"
        data-orbit-clearance="${hubClearance}"
        data-orbit-duration="${markerSpeed.toFixed(2)}"
        data-orbit-radius-x="${radiusX}"
        data-orbit-radius-y="${radiusY}"
        data-orbit-phase="${phase.toFixed(2)}"
        data-orbit-reverse="${String(reverse)}"
        style="--orbit-parent-x:${parentPosition.x}px;--orbit-parent-y:${parentPosition.y}px;--orbit-width:${orbitWidth}px;--orbit-height:${orbitHeight}px;--orbit-angle:${angle.toFixed(2)}deg"
        aria-hidden="true"
      ><span class="mission-orbit-signal"></span></div>`;
    })
    .join("");

  const nodes = portfolioNodes
    .map((node) => {
      const hub = categoryHubs.find((candidate) => candidate.id === node.missionGroup);
      const isMergedHub = hub?.mergedMissionId === node.id;
      const displayTitle = node.title;
      const mergedHubClass = isMergedHub ? (hub.missionIds.length === 1 ? "single-category-node" : "merged-category-hub-node") : "";
      const careerCompanyClass = node.id === "haia" || node.id === "axians" ? "career-company-node" : "";
      const haiaMoonClass = node.id === "ilac" || node.id === "publications" ? "haia-moon-node" : "";
      const priorityDestinationClass = node.id === "contact" ? "priority-destination-node" : "";

      return `
        <button
          class="node mission-orb group-${node.missionGroup} ${node.sector === "interface" ? "bridge-node" : ""} ${isMergedHub ? `category-hub-node ${mergedHubClass}` : "category-satellite"} ${careerCompanyClass} ${haiaMoonClass} ${priorityDestinationClass}"
          data-node-id="${node.id}"
          data-mission-group="${node.missionGroup}"
          style="--node-x:${node.position.x}px;--node-y:${node.position.y}px"
          type="button"
          aria-label="Open ${node.detail.title} information"
          title="Mission ${node.index} — ${node.detail.title}"
        >
          <span class="orb-hit-target" aria-hidden="true"></span>
          <span class="node-index">${node.index}</span><i></i>
          <b class="network-node-title">${displayTitle}</b>
          <b class="timeline-node-title">${node.title}</b>
          <small>${node.subtitle}</small>
          <span class="orbit-label ${statusClass(node.statusTone)}">${node.status}</span>
        </button>`;
    })
    .join("");

  return `
    <main class="viewport" id="viewport" tabindex="-1" aria-label="Interactive PEN engineering network">
      <div class="world" id="world" style="--world-width:${worldSize.width}px;--world-height:${worldSize.height}px">
        <div class="map-nebula" aria-hidden="true"></div>
        ${renderConstellationField()}
        ${renderCelestialOrnaments()}
        <div
          class="map-boundary"
          aria-hidden="true"
          style="left:${mapBounds.minX}px;top:${mapBounds.minY}px;width:${mapBounds.maxX - mapBounds.minX}px;height:${mapBounds.maxY - mapBounds.minY}px"
        ></div>

        <div class="sector sector-physical" aria-hidden="true"><span>SECTOR A / PHYSICAL + OT</span></div>
        <div class="sector sector-interface" aria-hidden="true"><span>SECTOR B / SYSTEM BRIDGES</span></div>
        <div class="sector sector-application" aria-hidden="true"><span>SECTOR C / APPLICATION + DATA</span></div>

        <svg class="links" width="${worldSize.width}" height="${worldSize.height}" viewBox="0 0 ${worldSize.width} ${worldSize.height}" aria-hidden="true">
          ${routes}
        </svg>

        <div class="timeline-layer" aria-hidden="true">
          <div class="timeline-axis"><span>CHRONOLOGY</span></div>
          ${timelineMarkers.map((marker) => `<div class="timeline-marker" style="--timeline-x:${marker.x}px"><i></i><span>${marker.label}</span></div>`).join("")}
          ${timelineLanes.map((lane) => `<div class="timeline-lane" style="--timeline-y:${lane.y}px"><div><b>${lane.label}</b><span>${lane.detail}</span></div><i></i></div>`).join("")}
          ${timelinePeriods.map((period) => `<div class="timeline-period" style="--period-x:${period.x}px;--period-y:${period.y}px;--period-width:${period.width}px"><span>${period.label}</span><b>${period.dates}</b></div>`).join("")}
          <div class="timeline-caption"><b>CAREER / EDUCATION TIMELINE</b><span>WORK, STUDY AND PROJECTS SEPARATED BY LANE</span></div>
        </div>

        ${categoryHubMarkup}
        ${missionOrbits}

        ${nodes}

        <div class="data-packet" id="packet" aria-hidden="true"><div class="packet-core">NLR</div><span class="packet-heading" data-i18n-skip>000°</span></div>
        <div class="packet-trail" id="packet-trail" aria-hidden="true"></div>
      </div>
    </main>`;
};
