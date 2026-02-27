const CONTROL_CHARS = /(?![\n\r\t])\p{Cc}/gu;

export function sanitizeUserInput(text: string, maxLength = 500): string {
  return text
    .replaceAll(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLength);
}
