import { Webhook } from "svix";
import { Request, Response } from "express";
import { syncClerkUser } from "../services/userService";

export async function handleClerkWebhook(req: Request, res: Response) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error("Error: CLERK_WEBHOOK_SECRET is missing");
    return res.status(500).json({ error: "Configuration error" });
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({
      error: "Error: Missing valid Svix headers",
    });
  }

  let evt: any;

  try {
    // Attempt to use rawBody if available (best practice), otherwise fallback to stringified body
    // Note: The Express route needs to be configured to provide rawBody or raw buffer
    const payload = (req as any).rawBody || JSON.stringify(req.body);
    
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Invalid signature",
    });
  }

  // Handle the event
  const eventType = evt.type;
  console.log(`[Webhook] Received Clerk event: ${eventType}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    try {
      await syncClerkUser(evt.data);
    } catch (e) {
      console.error("Failed to sync user:", e);
      return res.status(500).json({ success: false, message: "Sync failed" });
    }
  }

  return res.status(200).json({ success: true });
}
