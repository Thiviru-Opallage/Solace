import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes user input text:
 * 1. Strips all HTML tags and attributes
 * 2. Normalizes Unicode to NFKC
 * 3. Strips non-printable ASCII control characters (keeping standard \r, \n, \t)
 * 4. Caps length
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") {
    return "";
  }

  // 1. Strip all HTML tags
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });

  // 2. Unicode normalization
  const normalized = stripped.normalize("NFKC");

  // 3. Strip non-printable control characters (\x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F)
  const clean = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 4. Cap length and trim
  return clean.slice(0, maxLength).trim();
}

/**
 * Escapes regex special characters in user input for safe searching
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
