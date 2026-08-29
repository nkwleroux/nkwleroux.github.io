import { en } from "../i18n/en.js";
import { es } from "../i18n/es.js";
import { nl } from "../i18n/nl.js";
import type { LanguageResource, PenLanguage } from "../i18n/types.js";

export type { PenLanguage } from "../i18n/types.js";

const STORAGE_KEY = "pen:language:v2";
const LEGACY_STORAGE_KEY = "pen:language:v1";
const DEFAULT_LANGUAGE: PenLanguage = "en";
const resources: Readonly<Record<PenLanguage, LanguageResource>> = { en, es, nl };
const translatableAttributes = ["aria-label", "title", "placeholder", "alt"] as const;
const translatableMetaSelector = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
].join(",");

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const originalMetaContent = new WeakMap<HTMLMetaElement, string>();

const translatedValueToSource = new Map<string, string>();
for (const language of ["es", "nl"] as const) {
  const resource = resources[language];
  for (const [source, translated] of Object.entries(resource.text)) {
    if (translated && translated !== source && !translatedValueToSource.has(translated)) {
      translatedValueToSource.set(translated, source);
    }
  }
  for (const [key, translated] of Object.entries(resource.ui)) {
    const source = en.ui[key];
    if (source && translated && translated !== source && !translatedValueToSource.has(translated)) {
      translatedValueToSource.set(translated, source);
    }
  }
  for (const [source, translated] of Object.entries(resource.titles)) {
    if (translated && translated !== source && !translatedValueToSource.has(translated)) {
      translatedValueToSource.set(translated, source);
    }
  }
}

const isLanguage = (value: string | null | undefined): value is PenLanguage =>
  value === "en" || value === "es" || value === "nl";

const resourceFor = (language: PenLanguage): LanguageResource => resources[language];

const sourceAndWhitespace = (value: string): { leading: string; source: string; trailing: string } => {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return {
    leading: match?.[1] ?? "",
    source: match?.[2] ?? value,
    trailing: match?.[3] ?? "",
  };
};

const normalizeSourceText = (value: string): string => translatedValueToSource.get(value) ?? value;

const translatedLabel = (source: string, language: PenLanguage): string =>
  resourceFor(language).text[source] ?? source;

type FamilyStage = "toddlers" | "small kids" | "teenagers" | "adults";

const familyStageTranslations: Readonly<Record<Exclude<PenLanguage, "en">, Readonly<Record<FamilyStage, string>>>> = {
  nl: {
    toddlers: "peuters",
    "small kids": "jonge kinderen",
    teenagers: "tieners",
    adults: "volwassen kinderen",
  },
  es: {
    toddlers: "niños pequeños",
    "small kids": "niños",
    teenagers: "adolescentes",
    adults: "hijos adultos",
  },
};

const translatedFamilyStage = (stage: FamilyStage, language: Exclude<PenLanguage, "en">): string =>
  familyStageTranslations[language][stage];

const translateDynamicSourceText = (source: string, language: PenLanguage): string | undefined => {
  if (language === "en") return source;

  const familyHeading = source.match(/^Family-oriented husband and father of two (toddlers|small kids|teenagers|adults)\.$/);
  if (familyHeading) {
    const stage = translatedFamilyStage((familyHeading[1] ?? "toddlers") as FamilyStage, language);
    return language === "nl"
      ? `Gezinsgerichte echtgenoot en vader van twee ${stage}.`
      : `Esposo orientado a la familia y padre de dos ${stage}.`;
  }

  const familyProfileStage = source.match(/raising two (toddlers|small kids|teenagers|adults),/);
  if (
    familyProfileStage
    && source.startsWith("I am a 25-year-old, family-oriented and goal-driven software and embedded systems engineer")
    && source.endsWith("creating a stable and fulfilling future for my family.")
  ) {
    const stage = translatedFamilyStage((familyProfileStage[1] ?? "toddlers") as FamilyStage, language);
    return language === "nl"
      ? `Ik ben een 25-jarige, gezinsgerichte en doelgedreven software- en embeddedsystemenengineer met een sterke interesse in het bouwen van betrouwbare technologie die software, hardware, netwerken en systemen in de echte wereld met elkaar verbindt. Ik ben getrouwd met mijn vrouw Alexia en samen voeden wij twee ${stage} op, wat mij een nog sterker gevoel van verantwoordelijkheid, doelgerichtheid en ambitie heeft gegeven. Professioneel ben ik gepassioneerd door embedded software, systeemintegratie, netwerken, IoT, API's en protocolcommunicatie. Ik los graag complexe technische problemen op waarvoor inzicht nodig is in de samenwerking tussen meerdere systeemlagen. Zowel mijn loopbaan als mijn privéleven benader ik met een langetermijnvisie: ik blijf mijn vaardigheden ontwikkelen, neem uitdagende projecten aan en werk eraan om een veelzijdige engineer te worden die complete, onderhoudbare systemen kan ontwerpen en bouwen, terwijl ik een stabiele en vervullende toekomst voor mijn gezin creëer.`
      : `Soy un ingeniero de software y sistemas embebidos de 25 años, orientado a la familia y a los objetivos, con un gran interés por crear tecnología fiable que conecte software, hardware, redes y sistemas del mundo real. Estoy casado con mi esposa, Alexia, y juntos estamos criando a dos ${stage}, lo que me ha dado un sentido aún mayor de responsabilidad, propósito y ambición. Profesionalmente, me apasionan el software embebido, la integración de sistemas, las redes, el IoT, las API y la comunicación mediante protocolos, y disfruto resolviendo problemas técnicos complejos que exigen comprender cómo funcionan conjuntamente varias capas de un sistema. Afronto tanto mi carrera como mi vida personal con una visión a largo plazo, desarrollando continuamente mis capacidades, asumiendo proyectos exigentes y trabajando para convertirme en un ingeniero integral capaz de diseñar y construir sistemas completos y mantenibles, mientras creo un futuro estable y satisfactorio para mi familia.`;
  }

  const mission = source.match(/^MISSION (\d{2})$/);
  if (mission) return language === "es" ? `MISIÓN ${mission[1]}` : `MISSIE ${mission[1]}`;

  const missionCount = source.match(/^(\d+) MISSIONS$/);
  if (missionCount) return language === "es" ? `${missionCount[1]} MISIONES` : `${missionCount[1]} MISSIES`;

  const indexedLabel = source.match(/^(\d{2}) \/\/ (.+)$/);
  if (indexedLabel) {
    return `${indexedLabel[1]} // ${translatedLabel(indexedLabel[2] ?? "", language)}`;
  }

  const mergedHubLabel = source.match(/^(ENTRY|PROFESSIONAL CAREER|PROJECT CONSTELLATION|ACADEMIC \+ CAPABILITY|CONTACT): (.+)$/);
  if (mergedHubLabel) {
    const hub = translatedLabel(mergedHubLabel[1] ?? "", language);
    const missionLabel = translatedLabel(mergedHubLabel[2] ?? "", language);
    return `${hub}: ${missionLabel}`;
  }

  const emailLabel = source.match(/^EMAIL \/\/ (.+)$/);
  if (emailLabel) {
    return language === "es" ? `CORREO // ${emailLabel[1]}` : `E-MAIL // ${emailLabel[1]}`;
  }

  const layerSplit = source.match(/^Physical (\d+)%, application (\d+)%$/);
  if (layerSplit) {
    return language === "es"
      ? `Capa física ${layerSplit[1]} por ciento, capa de aplicación ${layerSplit[2]} por ciento`
      : `Fysieke laag ${layerSplit[1]} procent, applicatielaag ${layerSplit[2]} procent`;
  }

  const viewSwitch = source.match(/^Switch to (timeline \/ expedition log|network \/ career map) view$/);
  if (viewSwitch) {
    const target = translatedLabel(viewSwitch[1] ?? "", language);
    return language === "es" ? `Cambiar a la vista ${target}` : `Schakel over naar de weergave ${target}`;
  }

  const nodeCount = source.match(/^(\d+) NODES \/ (\d+) GUIDED MISSIONS$/);
  if (nodeCount) {
    return language === "es"
      ? `${nodeCount[1]} NODOS / ${nodeCount[2]} MISIONES GUIADAS`
      : `${nodeCount[1]} NODES / ${nodeCount[2]} BEGELEIDE MISSIES`;
  }

  const categoryHub = source.match(/^Travel to (.+) category hub$/);
  if (categoryHub) {
    const label = translatedLabel(categoryHub[1] ?? "", language);
    return language === "es" ? `Ir al centro de categoría ${label}` : `Ga naar categoriehub ${label}`;
  }

  const openInformation = source.match(/^Open (.+) information$/);
  if (openInformation) {
    const label = translatedLabel(openInformation[1] ?? "", language);
    return language === "es" ? `Abrir información de ${label}` : `Informatie over ${label} openen`;
  }

  const missionLabel = source.match(/^Mission (\d+) — (.+)$/);
  if (missionLabel) {
    const label = translatedLabel(missionLabel[2] ?? "", language);
    return language === "es"
      ? `Misión ${missionLabel[1]} — ${label}`
      : `Missie ${missionLabel[1]} — ${label}`;
  }

  const fitMap = source.match(/^Fit the complete map in view\. Current zoom (\d+) percent$/);
  if (fitMap) {
    return language === "es"
      ? `Ajustar el mapa completo a la vista. Zoom actual: ${fitMap[1]} por ciento`
      : `Toon de volledige kaart in beeld. Huidige zoom: ${fitMap[1]} procent`;
  }

  const recoveryRange = source.match(/^RECOVERY NODE IN RANGE \/\/ (.+)$/);
  if (recoveryRange) {
    return language === "es"
      ? `NODO DE RECUPERACIÓN EN RANGO // ${recoveryRange[1]}`
      : `HERSTELNODE BINNEN BEREIK // ${recoveryRange[1]}`;
  }

  const routeRecovered = source.match(/^ROUTE RECOVERED \/\/ (.+)$/);
  if (routeRecovered) {
    return language === "es"
      ? `RUTA RECUPERADA // ${routeRecovered[1]}`
      : `ROUTE HERSTELD // ${routeRecovered[1]}`;
  }

  return undefined;
};

const translateSourceText = (source: string, language: PenLanguage): string => {
  if (language === "en") return source;
  return resourceFor(language).text[source] ?? translateDynamicSourceText(source, language) ?? source;
};

export const currentLanguage = (): PenLanguage => {
  const fromDom = document.documentElement.lang;
  if (isLanguage(fromDom)) return fromDom;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Storage may be unavailable; fall back to English.
  }
  return DEFAULT_LANGUAGE;
};

export const translate = (key: string, language = currentLanguage()): string =>
  resourceFor(language).ui[key] ?? en.ui[key] ?? key;

export const translateText = (source: string, language = currentLanguage()): string =>
  translateSourceText(normalizeSourceText(source), language);

const translateTextNode = (node: Text, language: PenLanguage): void => {
  const parent = node.parentElement;
  if (!parent || parent.closest("script, style, [data-i18n-skip], [data-i18n]")) return;

  let source = originalText.get(node);
  if (source === undefined) {
    const current = node.nodeValue ?? "";
    const { leading, source: trimmedCurrent, trailing } = sourceAndWhitespace(current);
    source = `${leading}${normalizeSourceText(trimmedCurrent)}${trailing}`;
    originalText.set(node, source);
  }

  const { leading, source: trimmedSource, trailing } = sourceAndWhitespace(source);
  if (!trimmedSource) return;
  const next = `${leading}${translateSourceText(trimmedSource, language)}${trailing}`;
  if (node.nodeValue !== next) node.nodeValue = next;
};

const translateElementAttributes = (element: Element, language: PenLanguage): void => {
  let sources = originalAttributes.get(element);
  if (!sources) {
    sources = new Map<string, string>();
    originalAttributes.set(element, sources);
  }

  for (const attribute of translatableAttributes) {
    if (!element.hasAttribute(attribute)) continue;
    if (!sources.has(attribute)) {
      const current = element.getAttribute(attribute) ?? "";
      sources.set(attribute, normalizeSourceText(current));
    }
    const source = sources.get(attribute) ?? "";
    const next = translateSourceText(source, language);
    if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
  }
};

const translateSemanticElement = (element: HTMLElement, language: PenLanguage): void => {
  const key = element.dataset["i18n"];
  if (!key) return;
  const resource = resourceFor(language);
  const fallback = en.ui[key];
  const next = resource.ui[key] ?? fallback;
  if (next !== undefined && element.textContent !== next) element.textContent = next;
};

const translateSubtree = (root: Node, language: PenLanguage): void => {
  if (root instanceof HTMLElement) {
    if (root.closest("[data-i18n-skip]")) return;
    translateElementAttributes(root, language);
    translateSemanticElement(root, language);
  }

  if (root instanceof Text) {
    translateTextNode(root, language);
    return;
  }

  const elementRoot = root instanceof Element ? root : document.body;
  if (!elementRoot || elementRoot.closest("[data-i18n-skip]")) return;

  elementRoot.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    translateSemanticElement(element, language);
  });

  elementRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (!element.closest("[data-i18n-skip]")) translateElementAttributes(element, language);
  });

  const walker = document.createTreeWalker(elementRoot, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text, language);
    current = walker.nextNode();
  }
};

const syncDocumentTitle = (language: PenLanguage): void => {
  const resource = resourceFor(language);
  const sourceTitle = document.documentElement.dataset["penSourceTitle"] ?? document.title;
  document.documentElement.dataset["penSourceTitle"] = sourceTitle;
  document.title = resource.titles[sourceTitle] ?? translateSourceText(sourceTitle, language);
};

const syncMetadata = (language: PenLanguage): void => {
  document.querySelectorAll<HTMLMetaElement>(translatableMetaSelector).forEach((meta) => {
    let source = originalMetaContent.get(meta);
    if (source === undefined) {
      source = normalizeSourceText(meta.content);
      originalMetaContent.set(meta, source);
    }
    meta.content = translateSourceText(source, language);
  });
};

export const syncLanguageControls = (): void => {
  const language = currentLanguage();
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLSelectElement>("[data-language-select]").forEach((select) => {
    select.value = language;
  });
  syncDocumentTitle(language);
  syncMetadata(language);
  if (document.body) translateSubtree(document.body, language);
};

export const applyLanguage = (language: PenLanguage): void => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Persistence is optional.
  }
  syncLanguageControls();
  window.dispatchEvent(new CustomEvent("pen:languagechange", { detail: { language } }));
};

export const applyStoredLanguage = (): void => {
  let language: PenLanguage = DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isLanguage(stored)) language = stored;
  } catch {
    // Keep English.
  }
  document.documentElement.lang = language;
  syncDocumentTitle(language);
  syncMetadata(language);
};

export const installLanguageControls = (): (() => void) => {
  const abort = new AbortController();
  syncLanguageControls();

  document.querySelectorAll<HTMLSelectElement>("[data-language-select]").forEach((select) => {
    select.addEventListener("change", () => {
      if (isLanguage(select.value)) applyLanguage(select.value);
    }, { signal: abort.signal });
  });

  const pendingRoots = new Set<Node>();
  let translationFrame = 0;
  const flushPendingRoots = (): void => {
    translationFrame = 0;
    const language = currentLanguage();
    for (const root of pendingRoots) translateSubtree(root, language);
    pendingRoots.clear();
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      if (target?.closest("[data-i18n-skip]")) continue;
      for (const node of mutation.addedNodes) pendingRoots.add(node);
    }
    if (pendingRoots.size > 0 && translationFrame === 0) {
      translationFrame = requestAnimationFrame(flushPendingRoots);
    }
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    abort.abort();
    observer.disconnect();
    cancelAnimationFrame(translationFrame);
    pendingRoots.clear();
  };
};
