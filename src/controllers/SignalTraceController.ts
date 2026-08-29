import { queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { prefersReducedMotion } from "../core/media.js";
import { signalTraces, type SignalTrace } from "../data/experience.js";

export class SignalTraceController {
  readonly #abort = new AbortController();
  readonly #modal = queryRequired<HTMLElement>("#signal-trace-modal");
  readonly #shell = queryRequired<HTMLElement>("#signal-trace-modal .experience-shell");
  readonly #stage = queryRequired<HTMLElement>("#trace-stage");
  readonly #status = queryRequired<HTMLElement>("#trace-status");
  readonly #progress = queryRequired<HTMLElement>("#trace-progress");
  #timer: number | null = null;
  #returnFocus: HTMLElement | null = null;
  #activeTrace: SignalTrace | null = null;

  constructor(private readonly onClose?: () => void) {
    this.#modal.inert = true;
    queryRequired<HTMLButtonElement>("#trace-close").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#trace-replay").addEventListener("click", () => this.#replay(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#trace-return").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    this.#modal.querySelectorAll<HTMLElement>("[data-close-experience]").forEach((element) => {
      element.addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    });
  }

  open(traceId: SignalTrace["id"]): void {
    const trace = signalTraces[traceId];
    this.#returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.#activeTrace = trace;
    queryRequired<HTMLElement>("#trace-kicker").textContent = translateText(trace.kicker);
    queryRequired<HTMLElement>("#trace-title").textContent = translateText(trace.title);
    queryRequired<HTMLElement>("#trace-intro").textContent = translateText(trace.intro);
    this.#shell.scrollTop = 0;
    setInertVisibility(this.#modal, true);
    document.documentElement.classList.add("experience-modal-open");
    this.#render(trace);
    this.#replay();
    requestAnimationFrame(() => queryRequired<HTMLButtonElement>("#trace-close").focus({ preventScroll: true }));
  }

  close(): void {
    const returnFocus = this.#returnFocus;
    this.#returnFocus = null;
    this.#clearTimer();
    this.#activeTrace = null;
    setInertVisibility(this.#modal, false, returnFocus);
    document.documentElement.classList.remove("experience-modal-open");
    this.onClose?.();

  }

  isOpen(): boolean {
    return this.#modal.getAttribute("aria-hidden") === "false";
  }

  destroy(): void {
    this.#clearTimer();
    this.#abort.abort();
  }

  #render(trace: SignalTrace): void {
    const outbound = trace.steps.map((step, index) => `
      <div class="trace-step" data-trace-index="${index}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <i></i>
        <div><b>${step.label}</b><p>${step.detail}</p>${step.code ? `<code>${step.code}</code>` : ""}</div>
      </div>`).join("");

    const returns = (trace.returnSteps ?? []).map((step, index) => {
      const absoluteIndex = trace.steps.length + index;
      return `
        <div class="trace-step return-step" data-trace-index="${absoluteIndex}">
          <span>${String(absoluteIndex + 1).padStart(2, "0")}</span>
          <i></i>
          <div><b>${step.label}</b><p>${step.detail}</p>${step.code ? `<code>${step.code}</code>` : ""}</div>
        </div>`;
    }).join("");

    this.#stage.innerHTML = `
      <div class="trace-lane"><span>OUTBOUND / COMMAND</span>${outbound}</div>
      ${returns ? `<div class="trace-turn"><span>DEVICE RESPONSE</span><i></i></div><div class="trace-lane return-lane"><span>RETURN / TELEMETRY</span>${returns}</div>` : ""}`;
  }

  #replay(): void {
    const trace = this.#activeTrace;
    if (!trace) return;
    this.#clearTimer();
    const steps = Array.from(this.#stage.querySelectorAll<HTMLElement>(".trace-step"));
    steps.forEach((step) => step.classList.remove("active", "complete"));
    this.#progress.style.width = "0%";
    this.#status.textContent = translateText("READY");

    if (prefersReducedMotion()) {
      steps.forEach((step) => step.classList.add("complete"));
      this.#progress.style.width = "100%";
      this.#status.textContent = translateText("TRACE COMPLETE");
      return;
    }

    let index = 0;
    const advance = (): void => {
      steps.forEach((step, stepIndex) => {
        step.classList.toggle("active", stepIndex === index);
        step.classList.toggle("complete", stepIndex < index);
      });
      this.#progress.style.width = `${Math.min(100, ((index + 1) / Math.max(1, steps.length)) * 100)}%`;
      const active = steps[index];
      const label = active?.querySelector("b")?.textContent ?? "PROCESSING";
      this.#status.textContent = translateText(label);

      index += 1;
      if (index < steps.length) {
        this.#timer = window.setTimeout(advance, 850);
      } else {
        this.#timer = window.setTimeout(() => {
          steps.forEach((step) => {
            step.classList.remove("active");
            step.classList.add("complete");
          });
          this.#status.textContent = translateText("TRACE COMPLETE");
          this.#progress.style.width = "100%";
          this.#timer = null;
        }, 900);
      }
    };

    advance();
  }

  #clearTimer(): void {
    if (this.#timer !== null) window.clearTimeout(this.#timer);
    this.#timer = null;
  }
}
