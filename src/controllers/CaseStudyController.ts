import { queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { caseStudies, type SignalTrace } from "../data/experience.js";
import type { NodeId } from "../domain/types.js";

export class CaseStudyController {
  readonly #abort = new AbortController();
  readonly #modal = queryRequired<HTMLElement>("#case-study-modal");
  readonly #shell = queryRequired<HTMLElement>("#case-study-modal .experience-shell");
  #returnFocus: HTMLElement | null = null;
  #activeNode: NodeId | null = null;
  #activeTrace: SignalTrace["id"] | null = null;

  constructor(
    private readonly onTrace: (traceId: SignalTrace["id"]) => void,
    private readonly onClose?: () => void,
  ) {
    this.#modal.inert = true;
    queryRequired<HTMLButtonElement>("#case-close").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#case-return").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#case-trace").addEventListener("click", () => {
      if (this.#activeTrace) this.onTrace(this.#activeTrace);
    }, { signal: this.#abort.signal });
    this.#modal.querySelectorAll<HTMLElement>("[data-close-experience]").forEach((element) => {
      element.addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    });
  }

  has(nodeId: NodeId): boolean {
    return caseStudies[nodeId] !== undefined;
  }

  open(nodeId: NodeId): void {
    const study = caseStudies[nodeId];
    if (!study) return;
    this.#returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.#activeNode = nodeId;
    this.#activeTrace = study.trace ?? null;
    this.#modal.dataset["caseId"] = nodeId;

    queryRequired<HTMLElement>("#case-eyebrow").textContent = translateText(study.eyebrow);
    queryRequired<HTMLElement>("#case-title").textContent = translateText(study.title);
    queryRequired<HTMLElement>("#case-thesis").textContent = translateText(study.thesis);
    queryRequired<HTMLElement>("#case-architecture").innerHTML = study.architecture
      .map((item, index) => `<span>${item}</span>${index < study.architecture.length - 1 ? "<i>→</i>" : ""}`)
      .join("");
    queryRequired<HTMLElement>("#case-body").innerHTML = study.sections
      .map((section) => `<section class="case-section"><span>${section.number} / ${section.label}</span><p>${section.body}</p></section>`)
      .join("");
    queryRequired<HTMLElement>("#case-proof").innerHTML = study.proof.map((item) => `<b>${item}</b>`).join("");

    const traceButton = queryRequired<HTMLButtonElement>("#case-trace");
    traceButton.hidden = !this.#activeTrace;
    this.#shell.scrollTop = 0;
    setInertVisibility(this.#modal, true);
    document.documentElement.classList.add("experience-modal-open");
    requestAnimationFrame(() => queryRequired<HTMLButtonElement>("#case-close").focus({ preventScroll: true }));
  }

  close(): void {
    if (!this.#activeNode) return;
    const returnFocus = this.#returnFocus;
    this.#returnFocus = null;
    this.#activeNode = null;
    this.#activeTrace = null;
    delete this.#modal.dataset["caseId"];
    setInertVisibility(this.#modal, false, returnFocus);
    document.documentElement.classList.remove("experience-modal-open");
    this.onClose?.();

  }

  isOpen(): boolean {
    return this.#modal.getAttribute("aria-hidden") === "false";
  }

  destroy(): void {
    this.#abort.abort();
  }
}
