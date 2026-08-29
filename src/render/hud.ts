import { renderPreferenceControls } from "./preferences.js";

export const renderHud = (): string => `
  <header class="hud pen-header" id="hud">
    <div class="hud-left">
      ${renderPreferenceControls("hud-preferences")}
      <a class="brand pen-header-brand" href="/" id="home-control" aria-label="Return to the PEN landing page"><b>PEN</b>//ENGINEERING NETWORK</a>
      <a class="control-btn pen-header-action control-link hud-desktop-resume" id="resume-link" href="./resume.html" data-i18n="hud.resume">RESUME</a>
      <a class="control-btn pen-header-action control-link hud-mobile-resume" id="mobile-resume-link" href="./resume.html" data-i18n="hud.resume">RESUME</a>
    </div>
    <div class="hud-location"><span class="status-dot"></span><span id="location">PROFILE NODE</span><small id="coordinates" data-i18n-skip>0430 / 0795</small></div>
    <nav class="hud-controls pen-header-actions" aria-label="Portfolio controls">
      <button class="control-btn pen-header-action view-toggle" id="view-toggle" type="button" aria-pressed="false" title="Expedition Log / Timeline">VIEW: TIMELINE</button>
      <button class="control-btn pen-header-action" id="missions-toggle" type="button" title="Projects & Experience">MISSIONS</button>
      <button class="control-btn pen-header-action quick-tour-control" id="quick-tour-toggle" type="button" data-i18n="hud.overview" title="60 Second Tour">60 SEC TOUR</button>
      <button class="control-btn pen-header-action" id="contact-toggle" type="button">CONTACT</button>
      <button class="control-btn pen-header-action" id="settings-toggle" type="button">SETTINGS</button>
      <button class="control-btn pen-header-action" id="help-toggle" type="button" data-i18n="hud.help">HELP</button>
      <button class="hud-menu-toggle" id="hud-menu-toggle" type="button" aria-expanded="false" aria-controls="hud-mobile-menu" aria-label="Open portfolio menu"><span></span><span></span><span></span></button>
    </nav>
    <div class="hud-mobile-menu" id="hud-mobile-menu" aria-hidden="true" inert>
      <button class="control-btn view-toggle" id="mobile-view-toggle" type="button" aria-pressed="false" title="Expedition Log / Timeline">VIEW: TIMELINE</button>
      <button class="control-btn quick-tour-control" id="mobile-quick-tour-toggle" type="button" data-i18n="hud.overview" title="60 Second Tour">60 SEC TOUR</button>
      <button class="control-btn" id="mobile-contact-toggle" type="button">CONTACT</button>
      <button class="control-btn" id="mobile-settings-toggle" type="button">SETTINGS</button>
      <button class="control-btn" id="mobile-help-toggle" type="button" data-i18n="hud.help">HELP</button>
    </div>
  </header>
  <div class="sector-legend" aria-hidden="true"><span>PHYSICAL SYSTEMS</span><i></i><span>APPLICATION SYSTEMS</span></div>`;
