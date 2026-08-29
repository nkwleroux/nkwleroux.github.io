import { recruiterTour } from "../data/experience.js";

export const renderExperienceOverlays = (): string => `
  <aside class="category-focus-card" id="category-focus-card" aria-live="polite" aria-hidden="true" inert>
    <span class="focus-eyebrow">CATEGORY FOCUS</span>
    <strong id="category-focus-title">HAIA</strong>
    <p id="category-focus-copy"></p>
    <div class="focus-meta"><b id="category-focus-count">4 MISSIONS</b><span>ESC TO EXIT</span></div>
    <button class="control-btn focus-back" id="category-focus-back" type="button">BACK TO NETWORK</button>
  </aside>

  <section class="signal-trace-modal experience-modal" id="signal-trace-modal" aria-hidden="true" inert aria-label="Signal trace" aria-modal="true" role="dialog">
    <div class="experience-backdrop" data-close-experience></div>
    <article class="trace-shell experience-shell">
      <header class="experience-header">
        <div><span id="trace-kicker">TRACE SIGNAL</span><b id="trace-title">SYSTEM TRACE</b></div>
        <button class="experience-close" id="trace-close" type="button" aria-label="Close signal trace">×</button>
      </header>
      <p class="experience-intro" id="trace-intro"></p>
      <div class="trace-status"><span>PACKET STATE</span><b id="trace-status">READY</b><i id="trace-progress"></i></div>
      <div class="trace-stage" id="trace-stage" aria-live="polite"></div>
      <footer class="trace-footer">
        <div class="trace-footer-actions">
          <button class="control-btn" id="trace-replay" type="button">REPLAY TRACE</button>
          <button class="control-btn" id="trace-return" type="button">RETURN TO MISSION</button>
        </div>
        <span>SIMPLIFIED ARCHITECTURE VISUALIZATION // NO PROPRIETARY PAYLOAD DATA</span>
      </footer>
    </article>
  </section>

  <section class="case-study-modal experience-modal" id="case-study-modal" aria-hidden="true" inert aria-label="Project case study" aria-modal="true" role="dialog">
    <div class="experience-backdrop" data-close-experience></div>
    <article class="case-study-shell experience-shell">
      <header class="experience-header case-study-header">
        <div><span id="case-eyebrow">CASE STUDY</span><b id="case-title">PROJECT</b></div>
        <button class="experience-close" id="case-close" type="button" aria-label="Close case study">×</button>
      </header>
      <div class="case-hero">
        <p id="case-thesis"></p>
        <div class="case-architecture" id="case-architecture" aria-label="Architecture flow"></div>
      </div>
      <div class="case-body" id="case-body"></div>
      <aside class="case-proof"><span>PROOF / EVIDENCE</span><div id="case-proof"></div></aside>
      <footer class="case-footer">
        <button class="control-btn" id="case-trace" type="button" hidden>TRACE SIGNAL</button>
        <button class="control-btn" id="case-return" type="button">RETURN TO MISSION</button>
      </footer>
    </article>
  </section>

  <aside class="mission-preview" id="mission-preview" aria-hidden="true">
    <span id="preview-index">MISSION 02</span>
    <strong id="preview-title">ILAC</strong>
    <small id="preview-role">PROTOCOL / API BRIDGE</small>
    <div class="preview-tech" id="preview-tech"></div>
    <p id="preview-outcome"></p>
    <b>CLICK TO VIEW DETAILS</b>
  </aside>


  <aside class="quick-tour-card" id="quick-tour-card" aria-hidden="true" inert aria-live="polite">
    <div class="quick-tour-head"><span>60 SECOND TOUR</span><b id="quick-tour-progress" data-i18n-skip>${`01 / ${String(recruiterTour.length).padStart(2, "0")}`}</b></div>
    <strong id="quick-tour-title">PROFILE</strong>
    <p id="quick-tour-copy"></p>
    <div class="quick-tour-timer"><i id="quick-tour-timer"></i></div>
    <button class="quick-tour-skip" id="quick-tour-skip" type="button">SKIP TOUR</button>
  </aside>

  <div class="context-cursor" id="context-cursor" aria-hidden="true"><span id="context-cursor-label">VIEW DETAILS</span></div>
`;
