// Removes personal data a pharmacist might type before anything leaves the server.
// Names cannot be detected reliably; the chat input warns against real patient data instead.

const PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g, // e-mail addresses
  /(?:\+|00)\s?212[\s.-]?\d(?:[\s.-]?\d){8}/g, // +212 / 00212 phone numbers
  /\b0[5-7](?:[\s.-]?\d){8}\b/g, // Moroccan 05 / 06 / 07 phone numbers
  /\b[A-Z]{1,2}\d{5,6}\b/gi, // CIN-like national ID numbers
  /\d(?:[\s.-]?\d){5,}/g, // any other run of 6 or more digits
];

export const REDACTED = "[supprimé]";

export function redact(text) {
  return PATTERNS.reduce((result, pattern) => result.replace(pattern, REDACTED), text);
}
