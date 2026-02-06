import React from "react";

/**
 * Linkify utility for detecting and rendering URLs in message text
 * Provides robust URL detection and safe link rendering with security attributes
 */

/**
 * Represents a text segment - either plain text or a URL
 */
export interface LinkifySegment {
  type: "text" | "url";
  content: string;
}

/**
 * Detects URLs in the given text and returns an array of segments
 *
 * @param text - The text to parse for URLs
 * @returns Array of segments (text or URL)
 */
export function linkify(text: string): LinkifySegment[] {
  if (!text || text.length === 0) {
    return [{ type: "text", content: text }];
  }

  // Robust regex pattern for URL detection
  // Matches: http://, https://, www., and common TLDs
  const urlRegex =
    /(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/g;

  const segments: LinkifySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = urlRegex.exec(text);

  while (match !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const textSegment = text.slice(lastIndex, match.index);
      if (textSegment.length > 0) {
        segments.push({ type: "text", content: textSegment });
      }
    }

    // Add the URL segment
    let url = match[0];

    // Add protocol if missing for www. URLs
    if (url.startsWith("www.") && !url.includes("://")) {
      url = `https://${url}`;
    }

    segments.push({ type: "url", content: url });
    lastIndex = urlRegex.lastIndex;

    // Get next match
    match = urlRegex.exec(text);
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.length > 0) {
      segments.push({ type: "text", content: remainingText });
    }
  }

  // If no URLs found, return the original text as a single segment
  if (segments.length === 0) {
    return [{ type: "text", content: text }];
  }

  return segments;
}

/**
 * Checks if a string is a valid URL
 *
 * @param str - The string to check
 * @returns True if the string is a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith("www.") ? `https://${str}` : str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by ensuring it has a protocol
 *
 * @param url - The URL to normalize
 * @returns The normalized URL with protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;

  // Add https:// if missing and starts with www.
  if (url.startsWith("www.") && !url.includes("://")) {
    return `https://${url}`;
  }

  // Add https:// if no protocol and looks like a domain
  if (!url.includes("://") && url.includes(".")) {
    return `https://${url}`;
  }

  return url;
}

/**
 * Extracts the domain from a URL for display purposes
 *
 * @param url - The URL to extract domain from
 * @returns The domain name (e.g., "example.com")
 */
export function extractDomain(url: string): string {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Truncates a URL for display while keeping it clickable
 *
 * @param url - The URL to truncate
 * @param maxLength - Maximum length before truncation (default: 40)
 * @returns Truncated URL with ellipsis if needed
 */
export function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) {
    return url;
  }

  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(normalizedUrl);

  if (domain.length < maxLength - 10) {
    return `${domain}...`;
  }

  return `${url.slice(0, maxLength - 3)}...`;
}

/**
 * Props for rendering a link component
 */
export interface LinkifyLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Default link renderer with security attributes
 *
 * @param props - Link props
 * @returns React anchor element
 */
export function LinkifyLink({ href, children, className, onClick }: LinkifyLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "text-blue-400 hover:text-blue-300 underline underline-offset-2"}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

/**
 * React hook to parse text into linkify segments
 *
 * @param text - The text to parse
 * @returns Array of linkify segments
 */
export function useLinkify(text: string): LinkifySegment[] {
  return React.useMemo(() => linkify(text), [text]);
}

export default linkify;
