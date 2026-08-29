export const renderThemeSwitch = (className = ""): string => `
  <div class="theme-switch ${className}" data-theme-switch role="group" aria-label="Color theme">
    <button class="theme-option theme-option-light" data-theme-option="light" type="button" aria-label="Use light mode" title="Light mode">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.25"></circle><path d="M12 2.5v2.1M12 19.4v2.1M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2.1M19.4 12h2.1M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5"></path></svg>
      <span class="visually-hidden">Light</span>
    </button>
    <button class="theme-option theme-option-dark" data-theme-option="dark" type="button" aria-label="Use dark mode" title="Dark mode">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 15.2A8 8 0 0 1 8.8 4.4 8.25 8.25 0 1 0 19.6 15.2Z"></path></svg>
      <span class="visually-hidden">Dark</span>
    </button>
    <span class="theme-switch-thumb" aria-hidden="true"></span>
  </div>`;

export const renderLanguageSelect = (className = ""): string => `
  <label class="language-control ${className}">
    <span class="visually-hidden">Language</span>
    <select data-language-select aria-label="Language">
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="nl">NL</option>
    </select>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"></path></svg>
  </label>`;

export const renderPreferenceControls = (className = ""): string => `
  <div class="preference-controls ${className}">
    ${renderThemeSwitch()}
    ${renderLanguageSelect()}
  </div>`;
