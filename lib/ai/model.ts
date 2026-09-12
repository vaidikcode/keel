/** Single place for the assistant model string; override with KEEL_MODEL. */
export const KEEL_MODEL = process.env.KEEL_MODEL?.trim() || "openai/gpt-4o-mini";
