/**
 * Global test setup for vitest
 * Mocks external services to prevent module resolution errors during test isolation
 */
import { vi } from "vitest";

// Mock email service globally
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(() => Promise.resolve(true)),
  getEmailTemplate: vi.fn(() => "<html>mock email</html>"),
  sendWelcomeEmail: vi.fn(() => Promise.resolve(true)),
}));

// Mock notification service globally
vi.mock("./services/notificationService", () => ({
  notificationService: {
    sendBadgeUnlocked: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
    sendMetricsReminder: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
    sendInstagramReconnectNeeded: vi.fn(() =>
      Promise.resolve({ inAppSuccess: true, emailSuccess: true })
    ),
    sendDualNotification: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
  },
}));
