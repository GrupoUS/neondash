/**
 * Simple linkify utility to parse text and detect URLs
 */

export interface LinkSegment {
  type: "text" | "url";
  content: string;
}

// URL regex pattern
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

/**
 * Parses text and splits it into segments of plain text and URLs
 */
export function linkify(text: string): LinkSegment[] {
  if (!text) return [];

  const segments: LinkSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the URL
    segments.push({
      type: "url",
      content: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", content: text }];
}

export default linkify;
