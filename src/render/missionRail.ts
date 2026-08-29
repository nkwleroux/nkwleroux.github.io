import { portfolioNodes } from "../data/portfolio.js";
import type { MissionGroup } from "../domain/types.js";

const groupOrder: readonly MissionGroup[] = ["entry", "professional", "projects", "academic", "contact"];

const groupLabels: Readonly<Record<MissionGroup, string>> = {
  entry: "PROFILE",
  professional: "PROFESSIONAL CAREER",
  projects: "PROJECT CONSTELLATION",
  academic: "ACADEMIC + CAPABILITY",
  contact: "CONTACT",
};

export const renderMissionRail = (): string => `
  <aside class="mission-rail" id="mission-rail" aria-label="PEN mission directory" aria-hidden="true" inert>
    <div class="rail-head">
      <div><span>PEN // MISSIONS — PROJECTS & EXPERIENCE</span><small>${portfolioNodes.length} NODES / ${portfolioNodes.length} GUIDED MISSIONS</small></div>
      <button id="missions-close" type="button" aria-label="Close missions">×</button>
    </div>
    <p>SELECT DESTINATION // ↑ ↓ + ENTER</p>
    <div class="mission-buttons" role="listbox" aria-label="Mission list">
      ${groupOrder.map((group) => {
        const nodes = portfolioNodes.filter((node) => node.missionGroup === group);
        if (nodes.length === 0) return "";
        return `
          <div class="mission-group" role="group" aria-label="${groupLabels[group]}">
            <div class="mission-group-label"><span>${groupLabels[group]}</span><small>${String(nodes.length).padStart(2, "0")}</small></div>
            ${nodes.map(
              (node) => `<button class="mission-button ${node.id === "profile" ? "active" : ""}" data-mission-id="${node.id}" type="button" role="option" aria-selected="${node.id === "profile" ? "true" : "false"}"><span>${node.index}</span><div><b>${node.detail.title}</b><small>${node.subtitle}</small>${node.id === "education" ? `<small class="mission-date">AVANS 2019–2025 · YONSEI AUG 2022–JUL 2023</small>` : ""}</div><em>${node.status}</em></button>`,
            ).join("")}
          </div>`;
      }).join("")}
    </div>
    <div class="rail-footer"><span>MISSIONS / PROJECTS & EXPERIENCE</span><b>↑ ↓ + ENTER</b><span>WORLD NAV</span><b>W A S D</b></div>
  </aside>`;
