import { queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";

export interface CommandPaletteCommand {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly keywords?: readonly string[];
  readonly run: () => void;
}

export class CommandPaletteController {
  readonly #abort = new AbortController();
  readonly #modal = queryRequired<HTMLElement>("#command-palette");
  readonly #input = queryRequired<HTMLInputElement>("#command-palette-input");
  readonly #list = queryRequired<HTMLElement>("#command-palette-list");
  #selected = 0;
  #filtered: readonly CommandPaletteCommand[] = [];
  #previousFocus: HTMLElement | null = null;

  constructor(private readonly commands: readonly CommandPaletteCommand[]) {
    this.#input.addEventListener("input", () => this.#render(), { signal: this.#abort.signal });
    this.#input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (this.#filtered.length === 0) return;
        const delta = event.key === "ArrowDown" ? 1 : -1;
        this.#selected = (this.#selected + delta + this.#filtered.length) % this.#filtered.length;
        this.#syncSelection();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        this.#runSelected();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    }, { signal: this.#abort.signal });
    this.#list.addEventListener("pointermove", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-command-id]") : null;
      if (!target) return;
      const index = this.#filtered.findIndex((command) => command.id === target.dataset["commandId"]);
      if (index >= 0 && index !== this.#selected) {
        this.#selected = index;
        this.#syncSelection();
      }
    }, { signal: this.#abort.signal });
    this.#list.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-command-id]") : null;
      if (!target) return;
      const index = this.#filtered.findIndex((command) => command.id === target.dataset["commandId"]);
      if (index < 0) return;
      this.#selected = index;
      this.#runSelected();
    }, { signal: this.#abort.signal });
    this.#modal.addEventListener("pointerdown", (event) => {
      if (event.target === this.#modal) this.close();
    }, { signal: this.#abort.signal });
    this.#modal.inert = true;
    this.#render();
  }

  isOpen(): boolean {
    return this.#modal.getAttribute("aria-hidden") === "false";
  }

  open(): void {
    if (this.isOpen()) return;
    this.#previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.#input.value = "";
    this.#selected = 0;
    this.#render();
    setInertVisibility(this.#modal, true);
    this.#modal.style.pointerEvents = "auto";
    requestAnimationFrame(() => this.#input.focus({ preventScroll: true }));
  }

  close(restoreFocus = true): void {
    if (!this.isOpen()) return;
    const focusTarget = restoreFocus ? this.#previousFocus : null;
    setInertVisibility(this.#modal, false, focusTarget);
    this.#modal.style.pointerEvents = "none";
    this.#previousFocus = null;
  }

  destroy(): void {
    this.#abort.abort();
  }

  #render(): void {
    const query = this.#input.value.trim().toLocaleLowerCase();
    this.#filtered = this.commands.filter((command) => {
      if (!query) return true;
      return [command.label, command.hint, ...(command.keywords ?? [])]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
    this.#selected = Math.min(this.#selected, Math.max(0, this.#filtered.length - 1));
    this.#list.replaceChildren();

    if (this.#filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "command-empty";
      empty.textContent = translateText("No matching commands");
      this.#list.append(empty);
      return;
    }

    this.#filtered.forEach((command, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-palette-item";
      button.dataset["commandId"] = command.id;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === this.#selected));
      const label = document.createElement("b");
      label.textContent = translateText(command.label);
      const hint = document.createElement("span");
      hint.textContent = translateText(command.hint);
      button.append(label, hint);
      this.#list.append(button);
    });
    this.#syncSelection();
  }

  #syncSelection(): void {
    Array.from(this.#list.querySelectorAll<HTMLElement>("[data-command-id]")).forEach((item, index) => {
      const selected = index === this.#selected;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      if (selected) item.scrollIntoView({ block: "nearest" });
    });
  }

  #runSelected(): void {
    const command = this.#filtered[this.#selected];
    if (!command) return;
    this.close(false);
    command.run();
  }
}
