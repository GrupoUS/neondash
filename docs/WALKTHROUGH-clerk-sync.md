# Clerk Webhook Synchronization Walkthrough

This document outlines the changes made to implement automatic synchronization between Clerk users and the Neon database.

## Changes Implemented

### 1. New Service: `server/services/userService.ts`
- Implements `syncClerkUser` function.
- **Upserts** users into the `users` table based on `clerkId`.
- **Links** existing `mentorado` profiles by matching email.
- **Creates** new `mentorado` profiles if none exist, with default `turma` assignment.

### 2. Webhook Handler: `server/webhooks/clerk.ts`
- Uses `svix` to verify Clerk webhook signatures.
- Parses `user.created` and `user.updated` events.
- Calls `syncClerkUser` to process the data.

### 3. Server Integration: `server/_core/index.ts`
- Mounted `POST /api/webhooks/clerk` endpoint.
- Configured `express.raw` middleware specifically for this route to enable secure signature verification.

## Configuration Required

> [!IMPORTANT]
> You must add the Clerk Webhook Secret to your `.env` file for verification to work.

1. Go to your Clerk Dashboard -> Webhooks.
2. Create a new endpoint pointing to `https://your-domain.com/api/webhooks/clerk`.
3. Subscribe to `user.created` and `user.updated` events.
4. Copy the **Signing Secret** (starts with `whsec_`).
5. Add it to your `.env` file:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

## Testing

### Local Testing with Tunneling
To test locally, you need to expose your local server (port 3000) to the internet using a tool like `ngrok` or `localtunnel`.

1. Start your dev server: `bun dev`
2. Start ngrok: `ngrok http 3000`
3. Update the Clerk Webhook Endpoint URL to your ngrok URL: `https://<your-ngrok-url>/api/webhooks/clerk`
4. Create a new user in your application (or valid simulator in Clerk dashboard).
5. Check the server logs for `[Webhook] Received Clerk event: user.created` and `[UserService] Successfully synced user ...`.

### Verification
- Check the `users` table in Neon to see the new user.
- Check the `mentorados` table to see if a linked record was created/updated.
