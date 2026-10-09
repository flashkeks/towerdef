/**
 * Zentrale String-Datei. ALLE sichtbaren Texte des Spiels stehen hier (Englisch).
 * Der Spieltitel steht nur unter `game.title`; alles andere setzt ihn per `{title}` ein.
 * Runde 11: Neustart, AA-Texte entfernt (alter Stand: git show 783865d:client/src/i18n/en.ts).
 */
export const en = {
  'game.title': 'Duskwardens',

  // Desktop-Sperre
  'gate.title': 'Desktop only',
  'gate.text': '{title} needs a mouse and a bigger screen. Please open this page on a desktop or laptop browser.',
  'gate.small': 'Your window is too small. Enlarge it to at least {w} x {h}.',
  'gate.back': 'Back to Kek-Game',

  // Platzhalter bis P3 (Runde 11)
  'wip.title': 'Rebuilding',
  'wip.text': '{title} is being rebuilt from scratch. Check back soon.',
} as const;

export type StringKey = keyof typeof en;
