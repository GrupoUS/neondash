/**
 * Google Calendar Service
 * Handles OAuth2 flow and Calendar API interactions
 */

import type { calendar_v3 } from "googleapis";
import { ENV } from "../_core/env";
import { createLogger } from "../_core/logger";

const logger = createLogger({ service: "googleCalendar" });

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = ENV.googleClientId;
const GOOGLE_CLIENT_SECRET = ENV.googleClientSecret;
const GOOGLE_REDIRECT_URI = ENV.googleRedirectUri;

// Google Calendar API scopes
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// Brazil timezone offset (UTC-3)
const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const BRAZIL_OFFSET = "-03:00";

/**
 * Format date to RFC3339 without milliseconds for Google Calendar API
 * Google expects format: 2026-02-04T14:00:00-03:00 (not 2026-02-04T17:00:00.000Z)
 */
function formatDateTimeForGoogle(date: Date): string {
  // Validate date
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date provided: ${date}`);
  }

  // Format as YYYY-MM-DDTHH:mm:ss
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Use explicit Brazil timezone offset instead of UTC Z
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${BRAZIL_OFFSET}`;
}

/**
 * Validate and sanitize date input
 * Returns valid Date or throws with descriptive error
 */
function validateDate(date: unknown, fieldName: string): Date {
  if (!date) {
    throw new Error(`${fieldName} is required`);
  }

  if (!(date instanceof Date)) {
    throw new Error(`${fieldName} must be a Date instance, got: ${typeof date}`);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is an invalid Date (NaN)`);
  }

  return date;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
  colorId?: string; // Google Calendar color ID (1-11)
  color?: string; // Hex color for display
}

// Google Calendar event color palette (colorId 1-11)
const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
  "1": "#7986CB", // Lavender
  "2": "#33B679", // Sage
  "3": "#8E24AA", // Grape
  "4": "#E67C73", // Flamingo
  "5": "#F6BF26", // Banana
  "6": "#F4511E", // Tangerine
  "7": "#039BE5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3F51B5", // Blueberry
  "10": "#0B8043", // Basil
  "11": "#D50000", // Tomato
};

/**
 * Check if Google OAuth is configured
 */
export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthUrl(state?: string): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // Required for refresh token
    prompt: "consent", // Force consent to get refresh token
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch calendar events from Google Calendar API
 */
export async function getEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  maxResults = 50
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch events: ${error}`);
  }

  const data: calendar_v3.Schema$Events = await response.json();

  return (data.items || []).map((event) => {
    const colorId = event.colorId || undefined;
    const color = colorId ? GOOGLE_CALENDAR_COLORS[colorId] : undefined;

    return {
      id: event.id || "",
      title: event.summary || "Sem título",
      description: event.description || undefined,
      start: new Date(event.start?.dateTime || event.start?.date || ""),
      end: new Date(event.end?.dateTime || event.end?.date || ""),
      allDay: Boolean(event.start?.date && !event.start?.dateTime),
      location: event.location || undefined,
      htmlLink: event.htmlLink || undefined,
      colorId,
      color,
    };
  });
}

/**
 * Create a new event
 */
export async function createEvent(
  accessToken: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  logger.debug("createEvent called", {
    hasTitle: Boolean(event.title),
    hasStart: Boolean(event.start),
    hasEnd: Boolean(event.end),
    allDay: event.allDay,
  });

  const isAllDay = event.allDay === true;

  // Validate dates
  if (!event.start) {
    throw new Error("Start date is required");
  }
  if (!event.end) {
    throw new Error("End date is required");
  }

  const validatedStart = validateDate(event.start, "start");
  const validatedEnd = validateDate(event.end, "end");

  const resource: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: isAllDay
      ? { date: validatedStart.toISOString().split("T")[0] }
      : { dateTime: formatDateTimeForGoogle(validatedStart), timeZone: BRAZIL_TIMEZONE },
    end: isAllDay
      ? { date: validatedEnd.toISOString().split("T")[0] }
      : { dateTime: formatDateTimeForGoogle(validatedEnd), timeZone: BRAZIL_TIMEZONE },
  };

  logger.debug("Sending POST request to Google Calendar API", { resource });

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Google Calendar API error", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      resource,
    });
    throw new Error(`Failed to create event: ${errorText}`);
  }

  const data = await response.json();
  logger.debug("Event created successfully", { eventId: data.id, title: data.summary });

  return {
    id: data.id || "",
    title: data.summary || "Sem título",
    description: data.description || undefined,
    start: new Date(data.start?.dateTime || data.start?.date || ""),
    end: new Date(data.end?.dateTime || data.end?.date || ""),
    allDay: Boolean(data.start?.date && !data.start?.dateTime),
    location: data.location || undefined,
    htmlLink: data.htmlLink || undefined,
  };
}

/**
 * Update an existing event (PATCH)
 */
export async function updateEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  logger.debug("updateEvent called", {
    eventId,
    hasTitle: Boolean(event.title),
    hasStart: Boolean(event.start),
    hasEnd: Boolean(event.end),
    allDay: event.allDay,
  });

  const resource: calendar_v3.Schema$Event = {};

  if (event.title) resource.summary = event.title;
  if (event.description !== undefined) resource.description = event.description;
  if (event.location !== undefined) resource.location = event.location;

  // Determine if we're updating as all-day (default to false if not specified)
  const isAllDay = event.allDay === true;

  if (event.start) {
    // Validate and format start date
    try {
      const validatedStart = validateDate(event.start, "start");
      resource.start = isAllDay
        ? { date: validatedStart.toISOString().split("T")[0] }
        : { dateTime: formatDateTimeForGoogle(validatedStart), timeZone: BRAZIL_TIMEZONE };

      logger.debug("Start date formatted", {
        original: event.start,
        formatted: resource.start,
      });
    } catch (error) {
      logger.error("Start date validation failed", { error, start: event.start });
      throw error;
    }
  }

  if (event.end) {
    // Validate and format end date
    try {
      const validatedEnd = validateDate(event.end, "end");
      resource.end = isAllDay
        ? { date: validatedEnd.toISOString().split("T")[0] }
        : { dateTime: formatDateTimeForGoogle(validatedEnd), timeZone: BRAZIL_TIMEZONE };

      logger.debug("End date formatted", {
        original: event.end,
        formatted: resource.end,
      });
    } catch (error) {
      logger.error("End date validation failed", { error, end: event.end });
      throw error;
    }
  }

  // Log the full payload for debugging
  logger.debug("Sending PATCH request to Google Calendar API", {
    eventId,
    resource,
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resource),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Google Calendar API error", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      eventId,
      resource,
    });
    throw new Error(`Failed to update event: ${errorText}`);
  }

  const data = await response.json();
  logger.debug("Event updated successfully", { eventId, title: data.summary });

  return {
    id: data.id || "",
    title: data.summary || "Sem título",
    description: data.description || undefined,
    start: new Date(data.start?.dateTime || data.start?.date || ""),
    end: new Date(data.end?.dateTime || data.end?.date || ""),
    allDay: Boolean(data.start?.date && !data.start?.dateTime),
    location: data.location || undefined,
    htmlLink: data.htmlLink || undefined,
  };
}

/**
 * Delete an event
 */
export async function deleteEvent(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
}

/**
 * Revoke OAuth tokens
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token revocation failed: ${error}`);
  }
}

export const googleCalendarService = {
  isGoogleConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  revokeToken,
};
