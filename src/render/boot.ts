import { renderPreferenceControls } from "./preferences.js";

export const renderPreloader = (): string => `
  <div class="signal-loader classic-loader-progress" id="signal-loader" aria-hidden="true">
    <div class="classic-loader-progress-shell">
      <div class="loader-progress-wrap">
        <div class="loader-progress"><i id="loader-progress-fill"></i></div>
        <span id="loader-percent" data-i18n-skip>000%</span>
      </div>
      <span class="compact-loader-status" id="loader-status" data-i18n="landing.initializing">INITIALIZING NETWORK</span>
    </div>
  </div>`;

export const renderBoot = (): string => `
  <section class="boot classic-landing" id="boot" aria-label="Nicholas Le Roux engineering portfolio">
    <div class="loader-grid" aria-hidden="true"></div>
    <div class="loader-scan" aria-hidden="true"></div>

    <header class="classic-landing-header">
      <div class="classic-header-left">
        ${renderPreferenceControls("landing-preferences")}
        <a class="loader-brand classic-landing-brand" href="./index.html" aria-label="PEN home"><b>PEN</b><span>//PORTFOLIO EXPEDITION</span></a>
      </div>
      <nav class="classic-landing-links" aria-label="Direct portfolio links">
        <a href="./contact/">CONTACT</a>
      </nav>
    </header>

    <div class="loader-shell classic-landing-shell">
      <div class="loader-core classic-landing-core">
        <div class="loader-orbit loader-orbit-a" aria-hidden="true"></div>
        <div class="loader-orbit loader-orbit-b" aria-hidden="true"></div>
        <div class="loader-orbit loader-orbit-c" aria-hidden="true"></div>
        <div class="loader-wordmark">
          <b>PEN</b>
          <small>PORTFOLIO EXPEDITION: NICHOLAS</small>
        </div>
        <i class="loader-node loader-node-a" aria-hidden="true"></i>
        <i class="loader-node loader-node-b" aria-hidden="true"></i>
        <i class="loader-node loader-node-c" aria-hidden="true"></i>
        <i class="loader-node loader-node-d" aria-hidden="true"></i>

        <div class="classic-landing-actions" aria-label="Portfolio entry options">
          <a class="classic-landing-action resume-action" href="./resume.html">
            <span data-i18n="landing.resume">VIEW RESUME</span><i aria-hidden="true">↗</i>
          </a>
          <button class="classic-landing-action explore-network-action" id="start" type="button">
            <span data-i18n="landing.exploreNetwork">EXPLORE THE NETWORK</span><i aria-hidden="true">→</i>
          </button>
        </div>
      </div>

      <div class="loader-route classic-landing-route" aria-hidden="true">
        <span>DEVICE</span><i></i><span>PROTOCOL</span><i></i><span>PLATFORM</span><i></i><span>INTERFACE</span>
      </div>
    </div>
  </section>`;
