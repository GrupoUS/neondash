/**
 * iCal Service - Parse public iCal calendar feeds
 * Uses ical.js library to parse VCALENDAR/VEVENT data
 */

import ICAL from "ical.js";

// Neon public calendar iCal URL (derived from embed URL)
const NEON_CALENDAR_ICS_URL =
  "https://calendar.google.com/calendar/ical/c15a01eaaf196a178bb081c139c1b533521c0fb67aebd3df87043d7257f65aa1%40group.calendar.google.com/public/basic.ics";

export interface ICalEvent {
  id: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  url: string | null;
}

// Simple in-memory cache with TTL
interface CacheEntry {
  events: ICalEvent[];
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and parse iCal feed from URL
 */
export async function fetchICalEvents(
  icsUrl: string = NEON_CALENDAR_ICS_URL
): Promise<ICalEvent[]> {
  // Check cache first
  const cached = cache.get(icsUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.events;
  }

  try {
    const response = await fetch(icsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
    }

    const icsString = await response.text();
    const events = parseICalString(icsString);

    // Update cache
    cache.set(icsUrl, { events, timestamp: Date.now() });

    return events;
  } catch (error) {
    // If fetch fails but we have stale cache, return it
    if (cached) {
      return cached.events;
    }
    throw error;
  }
}

/**
 * Parse iCal string into structured events
 */
export function parseICalString(icsString: string): ICalEvent[] {
  const jcalData = ICAL.parse(icsString);
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents("vevent");

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  const dateRange = { oneMonthAgo, threeMonthsFromNow };

  const events: ICalEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      events.push(...parseRecurringEvent(event, vevent, dateRange));
    } else {
      const parsed = parseSingleEvent(event, vevent, dateRange);
      if (parsed) events.push(parsed);
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}

interface DateRange {
  oneMonthAgo: Date;
  threeMonthsFromNow: Date;
}

/**
 * Parse recurring event occurrences within date range
 */
function parseRecurringEvent(
  event: ICAL.Event,
  vevent: ICAL.Component,
  { oneMonthAgo, threeMonthsFromNow }: DateRange
): ICalEvent[] {
  const occurrences: ICalEvent[] = [];
  const iterator = event.iterator();
  let next = iterator.next();
  let count = 0;
  const maxOccurrences = 50;

  while (next && count < maxOccurrences) {
    const occurrenceStart = next.toJSDate();
    if (occurrenceStart > threeMonthsFromNow) break;

    if (occurrenceStart >= oneMonthAgo) {
      const duration = event.duration;
      const occurrenceEnd = new Date(
        occurrenceStart.getTime() + (duration ? duration.toSeconds() * 1000 : 3600000)
      );

      occurrences.push({
        id: `${event.uid}-${occurrenceStart.getTime()}`,
        title: event.summary || "Evento Neon",
        description: event.description || null,
        start: occurrenceStart,
        end: occurrenceEnd,
        allDay: isAllDayEvent(vevent),
        location: event.location || null,
        url: extractZoomLink(event.description || event.location || ""),
      });
    }

    next = iterator.next();
    count++;
  }

  return occurrences;
}

/**
 * Parse single (non-recurring) event
 */
function parseSingleEvent(
  event: ICAL.Event,
  vevent: ICAL.Component,
  { oneMonthAgo, threeMonthsFromNow }: DateRange
): ICalEvent | null {
  const startDate = event.startDate?.toJSDate();
  const endDate = event.endDate?.toJSDate();

  if (!startDate || startDate < oneMonthAgo || startDate > threeMonthsFromNow) {
    return null;
  }

  return {
    id: event.uid || `event-${startDate.getTime()}`,
    title: event.summary || "Evento Neon",
    description: event.description || null,
    start: startDate,
    end: endDate || new Date(startDate.getTime() + 3600000),
    allDay: isAllDayEvent(vevent),
    location: event.location || null,
    url: extractZoomLink(event.description || event.location || ""),
  };
}

/**
 * Check if event is all-day
 */
function isAllDayEvent(vevent: ICAL.Component): boolean {
  return vevent.hasProperty("dtstart")
    ? vevent.getFirstProperty("dtstart")?.type === "date"
    : false;
}

/**
 * Extract Zoom/Meet link from description or location
 */
function extractZoomLink(text: string): string | null {
  // Match Zoom links
  const zoomMatch = text.match(/https:\/\/[a-z0-9-]+\.zoom\.us\/[^\s<"]+/i);
  if (zoomMatch) return zoomMatch[0];

  // Match Google Meet links
  const meetMatch = text.match(/https:\/\/meet\.google\.com\/[^\s<"]+/i);
  if (meetMatch) return meetMatch[0];

  // Match generic https links as fallback
  const httpsMatch = text.match(/https:\/\/[^\s<"]+/i);
  if (httpsMatch) return httpsMatch[0];

  return null;
}

/**
 * Clear the cache (useful for manual refresh)
 */
export function clearICalCache(): void {
  cache.clear();
}

/**
 * Get Neon calendar events (convenience function)
 */
export async function getNeonCalendarEvents(): Promise<ICalEvent[]> {
  return fetchICalEvents(NEON_CALENDAR_ICS_URL);
}
