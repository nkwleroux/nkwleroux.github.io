export type PenLanguage = "en" | "es" | "nl";

export interface LanguageResource {
  readonly code: PenLanguage;
  readonly label: string;
  readonly ui: Readonly<Record<string, string>>;
  readonly text: Readonly<Record<string, string>>;
  readonly titles: Readonly<Record<string, string>>;
}
