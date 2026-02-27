const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeUserInput(text: string, maxLength = 500): string {
  return text
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLength);
}
