/**
 * Google Calendar Service
 * Handles OAuth2 flow and Calendar API interactions
 */

import type { calendar_v3 } from "googleapis";
import { ENV } from "../_core/env";

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = ENV.googleClientId;
const GOOGLE_CLIENT_SECRET = ENV.googleClientSecret;
const GOOGLE_REDIRECT_URI = ENV.googleRedirectUri;

// Google Calendar API scopes
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

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
}

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

  return (data.items || []).map((event) => ({
    id: event.id || "",
    title: event.summary || "Sem título",
    description: event.description || undefined,
    start: new Date(event.start?.dateTime || event.start?.date || ""),
    end: new Date(event.end?.dateTime || event.end?.date || ""),
    allDay: Boolean(event.start?.date && !event.start?.dateTime),
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
  }));
}

/**
 * Create a new event
 */
export async function createEvent(
  accessToken: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const resource: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.allDay
      ? { date: event.start?.toISOString().split("T")[0] }
      : { dateTime: event.start?.toISOString() },
    end: event.allDay
      ? { date: event.end?.toISOString().split("T")[0] }
      : { dateTime: event.end?.toISOString() },
  };

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  const data = await response.json();
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
  const resource: calendar_v3.Schema$Event = {};

  if (event.title) resource.summary = event.title;
  if (event.description !== undefined) resource.description = event.description;
  if (event.location !== undefined) resource.location = event.location;

  if (event.start) {
    resource.start = event.allDay
      ? { date: event.start.toISOString().split("T")[0] }
      : { dateTime: event.start.toISOString() };
  }

  if (event.end) {
    resource.end = event.allDay
      ? { date: event.end.toISOString().split("T")[0] }
      : { dateTime: event.end.toISOString() };
  }

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
    const error = await response.text();
    throw new Error(`Failed to update event: ${error}`);
  }

  const data = await response.json();
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
