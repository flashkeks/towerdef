/** Kleine DOM-Helfer. Texte kommen immer schon uebersetzt hier an (t() im Aufrufer). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Setzt Text nur bei Aenderung (vermeidet DOM-Arbeit in jedem Frame). */
export function setText(e: HTMLElement, text: string): void {
  if (e.textContent !== text) e.textContent = text;
}

export function setClass(e: HTMLElement, cls: string, on: boolean): void {
  if (e.classList.contains(cls) !== on) e.classList.toggle(cls, on);
}

export function clear(e: HTMLElement): void {
  while (e.firstChild) e.removeChild(e.firstChild);
}
