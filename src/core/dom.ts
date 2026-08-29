export const queryRequired = <T extends Element>(
  selector: string,
  root: ParentNode = document,
): T => {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required DOM element not found: ${selector}`);
  }
  return element;
};

export const clearElement = (element: Element): void => {
  element.replaceChildren();
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

export const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("button, a, input, textarea, select, [contenteditable='true']"));
};

export const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
};

export const canReceiveProgrammaticFocus = (element: HTMLElement | null | undefined): element is HTMLElement => {
  if (!element?.isConnected) return false;
  if (element.closest("[inert]")) return false;
  if (element.closest('[aria-hidden="true"]')) return false;
  return element.offsetParent !== null || element === document.body;
};

export const moveFocusOutside = (
  container: HTMLElement,
  preferredTarget?: HTMLElement | null,
): void => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !container.contains(active)) return;

  if (preferredTarget && !container.contains(preferredTarget) && canReceiveProgrammaticFocus(preferredTarget)) {
    preferredTarget.focus({ preventScroll: true });
    return;
  }

  active.blur();
};

export const setInertVisibility = (
  element: HTMLElement,
  visible: boolean,
  focusTarget?: HTMLElement | null,
): void => {
  if (visible) {
    element.setAttribute("aria-hidden", "false");
    element.inert = false;
    return;
  }

  moveFocusOutside(element, focusTarget);
  element.inert = true;
  element.setAttribute("aria-hidden", "true");
};
