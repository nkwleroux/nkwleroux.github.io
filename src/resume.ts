import { siteConfig } from "./config/site.js";
import { queryRequired } from "./core/dom.js";
import { nodeById } from "./data/portfolio.js";
import { projectArchive } from "./data/projects.js";
import { projectPresentationMetaById } from "./data/projectPresentation.js";
import type { DetailBlock, PortfolioNode } from "./domain/types.js";
import { renderDetailBlock } from "./render/detailBlocks.js";
import { renderResumeTechnologyIcons } from "./render/layerIcons.js";
import { applyStoredTheme, installThemeControls } from "./core/theme.js";
import { applyStoredLanguage, installLanguageControls, translateText } from "./core/language.js";
import { renderPreferenceControls } from "./render/preferences.js";
import { applyExperienceSettings } from "./core/experienceSettings.js";

applyStoredTheme();
applyStoredLanguage();
applyExperienceSettings();

const root = queryRequired<HTMLElement>("#resume-app");

const findBlock = <T extends DetailBlock["type"]>(
  node: PortfolioNode,
  type: T,
): Extract<DetailBlock, { type: T }> | undefined =>
  node.detail.blocks.find((block): block is Extract<DetailBlock, { type: T }> => block.type === type);

const appendRenderableBlocks = (
  target: HTMLElement,
  node: PortfolioNode,
  excluded: readonly DetailBlock["type"][] = ["action", "tags"],
): void => {
  for (const block of node.detail.blocks) {
    if (excluded.includes(block.type)) continue;
    target.append(renderDetailBlock(block));
  }
};

const tagsFor = (node: PortfolioNode): readonly string[] =>
  findBlock(node, "tags")?.tags ?? [];

const renderTagList = (tags: readonly string[]): string =>
  tags.map((tag) => `<span>${tag}</span>`).join("");

const renderProjectPresentation = (nodeId: "ilac" | "axians"): string => {
  const meta = projectPresentationMetaById[nodeId];
  if (!meta) return "";
  const fields = [
    ["ROLE", meta.role],
    ["TEAM", meta.team],
    ["PERIOD", meta.period],
    ["STATUS", meta.status],
    ["IMPACT", meta.impact],
  ] as const;
  return `
    <div class="resume-role-badges" aria-label="Project role badges">${meta.badges.map((badge) => `<span>${badge}</span>`).join("")}</div>
    <div class="resume-impact-strip" aria-label="Project impact summary">
      ${fields.map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("")}
    </div>`;
};

const haia = nodeById.haia;
const ilac = nodeById.ilac;
const axians = nodeById.axians;
const skills = nodeById.skills;
const education = nodeById.education;
const profile = nodeById.profile;

const capabilities = findBlock(skills, "capabilities");
const timeline = findBlock(haia, "timeline");
const contactDisabled = siteConfig.contactFormEnabled ? "" : "disabled";

const skillsForIcons = (value: string): readonly string[] =>
  value.split(" · ").map((item) => item.trim()).filter((item) => item.length > 0);

const projectArchiveBlock: DetailBlock = {
  type: "projects",
  label: "PROJECT INVENTORY",
  projects: projectArchive,
};

root.innerHTML = `
  <header class="site-header pen-header resume-header">
    <nav class="nav container" aria-label="Resume navigation">
      ${renderPreferenceControls("resume-preferences")}
      <a class="return-link pen-header-brand" id="resume-back" href="./index.html?restore=1" aria-label="Return directly to Network Expedition">
        <span class="brand-mark">←</span><span data-i18n="resume.back">Network Expedition</span>
      </a>
      <button class="nav-toggle" id="resume-nav-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links pen-header-actions" id="resume-nav-links">
        <a class="pen-header-action" href="#about" data-i18n="resume.about">About</a>
        <a class="pen-header-action" href="#featured-missions" data-i18n="resume.featuredMissions">Featured Missions</a>
        <a class="pen-header-action" href="#publications" data-i18n="resume.publications">Publications</a>
        <a class="pen-header-action" href="#experience" data-i18n="resume.experience">Experience</a>
        <a class="pen-header-action" href="#projects" data-i18n="resume.projects">Projects</a>
        <a class="pen-header-action" href="#skills" data-i18n="resume.skills">Skills</a>
        <a class="pen-header-action" href="#education" data-i18n="resume.education">Education</a>
        <a class="pen-header-action" href="/resume.pdf" download>RESUME PDF</a>
        <a class="pen-header-action is-primary" href="#contact" data-i18n="resume.contact">Contact</a>
      </div>
    </nav>
  </header>

  <main>
    <section class="hero section" id="home">
      <div class="container hero-grid">
        <div class="hero-copy reveal">
          <p class="eyebrow">Embedded Software Engineer · Industrial / OT · IoT · Networking</p>
          <h1>${siteConfig.name}<span class="gradient-text">I BUILD SOFTWARE THAT TALKS TO HARDWARE.</span></h1>
          <p class="hero-text">${profile.detail.lede}</p>
          <div class="hero-actions">
            <a class="button primary" href="#experience">View experience</a>
            <a class="button secondary" href="#projects">Explore projects</a>
            <a class="button secondary" href="/resume.pdf" download>Resume PDF</a>
          </div>
          <div class="hero-tags">
            ${renderTagList(["C++", "IFSF", "LonWorks", "TP/FT-10", "REST APIs", "TCP/IP", "ASP.NET Core", "IoT"])}
          </div>
        </div>

        <div class="hero-visual reveal" aria-hidden="true">
          <div class="terminal-card">
            <div class="terminal-bar"><span></span><span></span><span></span></div>
            <div class="terminal-body">
              <p><span class="prompt">$</span> whoami</p>
              <p class="terminal-output">Nicholas Le Roux</p>

              <p><span class="prompt">$</span> current-role</p>
              <p class="terminal-output">Embedded Software Engineer<br>@ Haia Consultancy</p>

              <p><span class="prompt">$</span> professional-focus</p>
              <p class="terminal-output">C++ · IFSF · LonWorks/LonTalk · TP/FT-10<br>REST · Oat++ · protocol conversion · OT modernization</p>

              <p><span class="prompt">$</span> professional-work</p>
              <p class="terminal-output">ILAC — IFSF LON API Converter · Haia Consultancy</p>

              <p><span class="prompt">$</span> industry-contributions</p>
              <p class="terminal-output">IFSF Engineering Bulletin No. 26 — Author / main contributor<br>IFSF Engineering Bulletin No. 27 — Sole author</p>

            </div>
          </div>
          <div class="floating-node node-one">IFSF</div>
          <div class="floating-node node-two">C++</div>
          <div class="floating-node node-three">REST</div>
        </div>
      </div>
    </section>

    <section class="section muted-section" id="about">
      <div class="container split-grid">
        <div class="section-heading reveal">
          <p class="eyebrow">About</p>
          <h2>Engineering across the full system.</h2>
        </div>
        <div class="about-copy reveal">
          <div id="about-copy"></div>
        </div>
      </div>
    </section>

    <section class="section featured-missions-section" id="featured-missions">
      <div class="container">
        <div class="section-heading reveal featured-missions-heading">
          <p class="eyebrow">01 / Featured Missions</p>
          <h2>Two missions. Two kinds of engineering evidence.</h2>
          <p class="section-intro">Professional protocol modernization and reusable C++ architecture with measurable impact.</p>
        </div>
        <div class="featured-mission-grid">
          <article class="featured-mission-card reveal mission-ilac">
            <div class="featured-mission-topline"><span>MISSION 01</span></div>
            <div class="featured-mission-signal" aria-hidden="true"><i></i><span></span><i></i></div>
            ${renderProjectPresentation("ilac")}
            <h3>ILAC — IFSF LON API Converter</h3>
            <p>Originally started as my Haia internship project and continued into my professional role. In 2026, a second developer joined under my supervision. I lead the two-person team, designed the architecture, remain the main developer, and make the primary technical decisions while building the C++ bridge between OpenRetailing Price Pole APIs and installed IFSF LON equipment.</p>
            <div class="featured-mission-evidence"><span>C++</span><span>IFSF</span><span>LonWorks</span><span>REST</span></div>
            <a href="./work/haia/ilac/">OPEN ILAC MISSION ↗</a>
          </article>
          <article class="featured-mission-card reveal mission-axians">
            <div class="featured-mission-topline"><span>MISSION 02</span></div>
            <div class="featured-mission-signal" aria-hidden="true"><i></i><span></span><i></i></div>
            ${renderProjectPresentation("axians")}
            <h3>Axians modular C++ IoT framework</h3>
            <p>Reusable C++ IoT architecture designed to remove repeated project setup. Estimated impact: approximately 40 engineering hours per month saved while also demonstrating architecture communication with senior technical stakeholders.</p>
            <div class="featured-mission-evidence"><span>C++</span><span>IOT</span><span>ARCHITECTURE</span><span>REUSE</span></div>
            <a href="./experience/axians/">OPEN AXIANS MISSION ↗</a>
          </article>
        </div>
      </div>
    </section>

    <section class="section muted-section" id="publications">
      <div class="container">
        <div class="section-heading reveal">
          <p class="eyebrow">02 / Publications & Industry Contributions</p>
          <h2>IFSF Engineering Bulletins 26 and 27</h2>
        </div>
        <div class="resume-publication-grid">
          <article class="resume-publication-card reveal">
            <span>ENGINEERING BULLETIN NO. 26</span>
            <h3>Renesas FT 5000 & FT 6050 End-of-Life issue</h3>
            <p>Examines the end-of-life of the Renesas FT 5000 and FT 6050 smart-transceiver SoCs and the resulting impact on IFSF-LON forecourt systems. It outlines the dependency of deployed TP/FT-10 equipment on these components and evaluates practical migration paths spanning alternative transceivers and hardware, host-based LON software stacks, interfaces, transformers, and gateways while supporting the longer-term move toward IP/API-based systems.</p>
          </article>
          <article class="resume-publication-card reveal">
            <span>ENGINEERING BULLETIN NO. 27</span>
            <h3>Price Pole API Standard to IFSF LON conversion</h3>
            <p>Defines a bidirectional mapping between IFSF Part 3-02 Price Pole Application v1.24 and the OpenRetailing Price Pole API Collections v1.0. It maps REST resources and fields to IFSF DB_Ad/Data_Id addressing, translates GET operations to Read/Answer and POST or update operations to Write/Acknowledge, and covers field encoding and error handling using Part 2-01 Communications over LonWorks v1.93 and Engineering Bulletin No. 11 as supporting standards.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="experience">
      <div class="container">
        <div class="section-heading reveal">
          <p class="eyebrow">03 / Experience</p>
          <h2>Professional career</h2>
          <p class="section-intro">Professional progression from C++ IoT architecture at Axians to Software Engineering Intern, IFSF Technical Support, and Full-time Embedded Software Engineer at Haia Consultancy.</p>
        </div>

        <div class="timeline reveal">
          <article class="timeline-item">
            <div class="timeline-date">${haia.detail.stats[1]?.value ?? "Sep 2024 — Present"}</div>
            <div class="timeline-content">
              <div class="role-heading">
                <div><h3>${haia.detail.title}</h3><p class="company">${haia.detail.stats[0]?.value ?? "Embedded Software Engineer"}</p></div>
                <span class="role-badge">Current</span>
              </div>
              <p class="experience-lede">${haia.detail.lede}</p>
              <div class="role-progression">
                ${(timeline?.entries ?? []).map((entry) => `<div><span>${entry.period}</span><strong>${entry.title}</strong></div>`).join("")}
              </div>
              <div id="haia-detail" class="experience-detail"></div>
              <div class="skill-tags">${renderTagList(tagsFor(haia))}</div>
            </div>
          </article>

          <article class="timeline-item second">
            <div class="timeline-date">${axians.detail.stats[1]?.value ?? "Aug 2021 — Jan 2022"}</div>
            <div class="timeline-content">
              <div class="role-heading">
                <div><h3>${axians.detail.title}</h3><p class="company">${axians.detail.stats[0]?.value ?? "Software Engineering Intern"}</p></div>
                <span class="role-badge">Internship</span>
              </div>
              <p class="experience-lede">${axians.detail.lede}</p>
              <div id="axians-detail" class="experience-detail"></div>
              <div class="skill-tags">${renderTagList(tagsFor(axians))}</div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section muted-section" id="systems">
      <div class="container">
        <div class="section-heading reveal">
          <p class="eyebrow">Professional system</p>
          <h2>${ilac.detail.title}</h2>
          <p class="section-intro">${ilac.detail.lede}</p>
        </div>
        ${renderProjectPresentation("ilac")}
        <div class="systems-card reveal" id="ilac-detail"></div>
      </div>
    </section>


    <section class="section" id="projects">
      <div class="container">
        <div class="section-heading reveal">
          <p class="eyebrow">Professional, academic & personal projects</p>
          <h2>Project archive</h2>
          <p class="section-intro">Networking, desktop applications, embedded systems, physical computing, graphics, computer vision, machine learning, and quantitative research—each reinforcing a different part of the engineering range shown in PEN.</p>
        </div>
        <div class="resume-project-archive reveal" id="projects-detail"></div>
      </div>
    </section>

    <section class="section muted-section" id="skills">
      <div class="container">
        <div class="skills-heading reveal">
          <div class="section-heading">
            <p class="eyebrow">Technical toolkit</p>
            <h2>Skills & technologies</h2>
            <p class="section-intro">${skills.detail.lede}</p>
          </div>
          <button class="skills-view-toggle" id="skills-view-toggle" type="button" aria-pressed="true">VIEW: TEXT</button>
        </div>
        <div class="skills-grid skills-icon-mode" id="skills-grid">
          ${(capabilities?.groups ?? []).map((group, index) => `
            <article class="skill-card reveal">
              <div class="skill-card-head">
                <div class="skill-icon">${String(index + 1).padStart(2, "0")}</div>
                <h3>${group.label}</h3>
              </div>
              <div class="skill-value-shell">
                <div class="skill-text-value"><p>${group.value}</p></div>
                ${renderResumeTechnologyIcons(skillsForIcons(group.value))}
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="section" id="education">
      <div class="container">
        <div class="section-heading reveal">
          <p class="eyebrow">Education</p>
          <h2>Computer engineering in the Netherlands, computer science in Seoul.</h2>
        </div>
        <div class="education-grid" id="education-detail"></div>
      </div>
    </section>

    <section class="section contact-section" id="contact">
      <div class="container contact-card reveal">
        <div class="contact-intro">
          <p class="eyebrow">Contact</p>
          <h2>Interested in embedded, IoT, industrial, networking, or backend engineering?</h2>
          <p>Send me a message about engineering roles, projects, collaboration, or systems that cross the hardware/software boundary.</p>
        </div>

        <div class="contact-actions">
          <button class="button primary" id="contact-me-button" type="button">Contact Me</button>
          <a class="button secondary" href="${siteConfig.githubUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a class="button secondary" href="${siteConfig.linkedInUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>

        <div class="contact-form-wrap" id="contact-form-wrap">
          <div class="contact-form-head">
            <span>MESSAGE:// NLR</span>
            <p>Send a message directly to <strong>${siteConfig.email}</strong>. Required fields are marked with *.</p>
          </div>

          <form class="contact-form ${siteConfig.contactFormEnabled ? "" : "contact-form-disabled"}" id="contact-form" autocomplete="off" aria-disabled="${String(!siteConfig.contactFormEnabled)}">
            <div class="form-field">
              <label for="contact-name">Name <span>*</span></label>
              <input id="contact-name" name="name" type="text" autocomplete="name" required ${contactDisabled} />
            </div>

            <div class="form-field">
              <label for="contact-email">Email address <span>*</span></label>
              <input id="contact-email" name="email" type="email" autocomplete="email" required ${contactDisabled} />
            </div>

            <div class="form-field">
              <label for="contact-phone">Phone number <small>Optional</small></label>
              <input id="contact-phone" name="phone" type="tel" autocomplete="tel" ${contactDisabled} />
            </div>

            <div class="form-field">
              <label for="contact-company">Company <small>Optional</small></label>
              <input id="contact-company" name="company" type="text" autocomplete="organization" ${contactDisabled} />
            </div>

            <div class="form-field form-field-wide">
              <label for="contact-subject">Subject <span>*</span></label>
              <input id="contact-subject" name="subject" type="text" required ${contactDisabled} />
            </div>

            <div class="form-field form-field-wide">
              <label for="contact-body">Message <span>*</span></label>
              <textarea id="contact-body" name="body" rows="8" required ${contactDisabled}></textarea>
            </div>

            <div class="contact-form-footer form-field-wide">
              <p id="contact-form-status" aria-live="polite">Required fields are marked with *.</p>
              <button class="button primary" id="contact-submit" type="submit" ${contactDisabled}>Send</button>
            </div>
          </form>

          <div class="contact-success" id="contact-success" hidden>
            <span>MESSAGE:// SENT</span>
            <h3>Message sent.</h3>
            <p>I will contact you as soon as possible.</p>
            <p class="contact-success-question">Would you like to send a new message?</p>
            <button class="button secondary" id="send-another-message" type="button">Send a new message</button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© ${siteConfig.currentYear} ${siteConfig.name}. Embedded Software Engineer.</p>
      <div class="footer-links">
        <a href="${siteConfig.portfolioSourceUrl}" target="_blank" rel="noopener noreferrer">Source code ↗</a>
        <a id="resume-back-footer" href="./index.html?restore=1">Return to expedition ↑</a>
      </div>
    </div>
  </footer>
`;

const aboutCopy = queryRequired<HTMLElement>("#about-copy");
appendRenderableBlocks(aboutCopy, profile, ["action", "tags"]);

const haiaDetail = queryRequired<HTMLElement>("#haia-detail");
appendRenderableBlocks(haiaDetail, haia, ["action", "tags", "timeline"]);

const axiansDetail = queryRequired<HTMLElement>("#axians-detail");
appendRenderableBlocks(axiansDetail, axians, ["action", "tags"]);

const ilacDetail = queryRequired<HTMLElement>("#ilac-detail");
appendRenderableBlocks(ilacDetail, ilac, ["action", "tags"]);

const projectsDetail = queryRequired<HTMLElement>("#projects-detail");
const projectArchiveElement = renderDetailBlock(projectArchiveBlock);
projectArchiveElement
  .querySelectorAll(".project-list-role-badges, .project-list-evidence")
  .forEach((element) => element.remove());
projectsDetail.append(projectArchiveElement);

const educationDetail = queryRequired<HTMLElement>("#education-detail");
appendRenderableBlocks(educationDetail, education, ["action", "tags"]);

const skillsGrid = queryRequired<HTMLElement>("#skills-grid");
const skillsViewToggle = queryRequired<HTMLButtonElement>("#skills-view-toggle");
let skillsIconMode = true;

const syncSkillsView = (): void => {
  skillsGrid.classList.toggle("skills-icon-mode", skillsIconMode);
  skillsViewToggle.textContent = translateText(skillsIconMode ? "VIEW: TEXT" : "VIEW: ICONS");
  skillsViewToggle.setAttribute("aria-pressed", String(skillsIconMode));
  skillsViewToggle.setAttribute("aria-label", translateText(skillsIconMode ? "Show skills as text" : "Show skills as icons"));
};

syncSkillsView();
skillsViewToggle.addEventListener("click", () => {
  skillsIconMode = !skillsIconMode;
  syncSkillsView();
});

const contactMeButton = queryRequired<HTMLButtonElement>("#contact-me-button");
const contactForm = queryRequired<HTMLFormElement>("#contact-form");
const contactFormWrap = queryRequired<HTMLElement>("#contact-form-wrap");
const contactName = queryRequired<HTMLInputElement>("#contact-name");
const contactStatus = queryRequired<HTMLElement>("#contact-form-status");
const contactSubmit = queryRequired<HTMLButtonElement>("#contact-submit");
const contactSuccess = queryRequired<HTMLElement>("#contact-success");
const sendAnotherMessage = queryRequired<HTMLButtonElement>("#send-another-message");

const initialContactStatus = siteConfig.contactFormEnabled
  ? "Required fields are marked with *."
  : "Contact form temporarily disabled.";

const resetContactFormState = (): void => {
  contactForm.reset();
  contactForm.hidden = false;
  contactSuccess.hidden = true;
  contactSubmit.disabled = !siteConfig.contactFormEnabled;
  contactSubmit.textContent = translateText("Send");
  contactStatus.textContent = translateText(initialContactStatus);

  contactForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((field) => {
    field.disabled = !siteConfig.contactFormEnabled;
  });
};

resetContactFormState();
window.addEventListener("pageshow", resetContactFormState);

contactMeButton.addEventListener("click", () => {
  contactFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  if (siteConfig.contactFormEnabled) {
    window.setTimeout(() => contactName.focus({ preventScroll: true }), 350);
  }
});

sendAnotherMessage.addEventListener("click", () => {
  resetContactFormState();
  contactFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  if (siteConfig.contactFormEnabled) {
    window.setTimeout(() => contactName.focus({ preventScroll: true }), 250);
  }
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!siteConfig.contactFormEnabled) {
    contactStatus.textContent = translateText("Contact form temporarily disabled.");
    return;
  }

  if (!contactForm.reportValidity()) {
    contactStatus.textContent = translateText("Please complete the required fields before sending your message.");
    return;
  }

  const data = new FormData(contactForm);
  const subject = String(data.get("subject") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();

  const payload = {
    name: String(data.get("name") ?? "").trim(),
    email,
    phone: String(data.get("phone") ?? "").trim(),
    company: String(data.get("company") ?? "").trim(),
    subject,
    message: String(data.get("body") ?? "").trim(),
    _subject: `PEN portfolio: ${subject}`,
    _replyto: email,
    _template: "table",
  };

  contactSubmit.disabled = true;
  contactSubmit.textContent = translateText("Sending…");
  contactStatus.textContent = translateText("Sending your message…");

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${siteConfig.email}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Contact form request failed with ${response.status}.`);

    contactForm.reset();
    contactForm.hidden = true;
    contactSuccess.hidden = false;
    contactSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    contactSubmit.disabled = false;
    contactSubmit.textContent = translateText("Send");
    contactStatus.textContent = translateText("The message could not be sent. Please try again later.");
  }
});

installThemeControls();
installLanguageControls();

const navToggle = queryRequired<HTMLButtonElement>("#resume-nav-toggle");
const navLinks = queryRequired<HTMLElement>("#resume-nav-links");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});
navLinks.addEventListener("keydown", (event) => {
  if (!(event.target instanceof HTMLElement)) return;
  const previous = event.key === "ArrowLeft" || event.key === "ArrowUp";
  const next = event.key === "ArrowRight" || event.key === "ArrowDown";
  if (!previous && !next) return;

  const links = Array.from(navLinks.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .filter((link) => link.offsetParent !== null);
  const current = links.indexOf(event.target as HTMLAnchorElement);
  if (current < 0 || links.length < 2) return;

  event.preventDefault();
  const delta = previous ? -1 : 1;
  links[(current + delta + links.length) % links.length]?.focus({ preventScroll: true });
});

const resumeHeader = queryRequired<HTMLElement>(".resume-header");
const resumeNavAnchors = Array.from(navLinks.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
const resumeNavSections = resumeNavAnchors
  .map((link) => {
    const id = link.getAttribute("href")?.slice(1) ?? "";
    const section = id ? document.getElementById(id) : null;
    return section ? { link, section } : null;
  })
  .filter((entry): entry is { link: HTMLAnchorElement; section: HTMLElement } => entry !== null);
let resumeScrollFrame = 0;

const syncResumeScrollPosition = (): void => {
  resumeScrollFrame = 0;
  if (resumeNavSections.length === 0) return;

  const marker = window.scrollY + resumeHeader.offsetHeight + 72;
  let active = resumeNavSections[0];
  for (const entry of resumeNavSections) {
    if (entry.section.offsetTop <= marker) active = entry;
    else break;
  }

  const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
  if (atPageEnd) active = resumeNavSections.at(-1) ?? active;

  for (const entry of resumeNavSections) {
    const current = entry === active;
    entry.link.classList.toggle("active", current);
    if (current) entry.link.setAttribute("aria-current", "location");
    else entry.link.removeAttribute("aria-current");
  }
};

const requestResumeScrollSync = (): void => {
  if (resumeScrollFrame !== 0) return;
  resumeScrollFrame = requestAnimationFrame(syncResumeScrollPosition);
};

window.addEventListener("scroll", requestResumeScrollSync, { passive: true });
window.addEventListener("resize", requestResumeScrollSync, { passive: true });
window.addEventListener("pageshow", requestResumeScrollSync);
window.addEventListener("hashchange", requestResumeScrollSync);
resumeNavAnchors.forEach((link) => link.addEventListener("click", () => {
  const target = resumeNavSections.find((entry) => entry.link === link);
  if (!target) return;
  for (const entry of resumeNavSections) {
    const current = entry === target;
    entry.link.classList.toggle("active", current);
    if (current) entry.link.setAttribute("aria-current", "location");
    else entry.link.removeAttribute("aria-current");
  }
}));
requestResumeScrollSync();

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.1 },
);
document.querySelectorAll<HTMLElement>(".reveal").forEach((element) => observer.observe(element));

