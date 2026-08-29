import { renderBoot, renderPreloader } from "./boot.js";
import { renderHud } from "./hud.js";
import { renderMissionRail } from "./missionRail.js";
import { renderCommandPalette, renderContactPanel, renderDetailPanel, renderHelp, renderLayerInspector, renderMinimap, renderProximity, renderSettings } from "./overlays.js";
import { renderWorld } from "./world.js";
import { renderExperienceOverlays } from "./experience.js";

export const renderAppShell = (): string => `
  <nav class="pen-skip-links" aria-label="Skip links">
    <a href="#viewport">Skip to network map</a>
  </nav>
  <div class="noise" aria-hidden="true"></div>
  <div class="landing-experience" id="landing-experience" aria-label="PEN introduction">
    ${renderPreloader()}
    ${renderBoot()}
  </div>
  ${renderHud()}
  ${renderWorld()}
  ${renderMissionRail()}
  ${renderDetailPanel()}
  ${renderProximity()}
  ${renderMinimap()}
  ${renderLayerInspector()}
  ${renderContactPanel()}
  ${renderSettings()}
  ${renderHelp()}
  ${renderCommandPalette()}
  ${renderExperienceOverlays()}`;
