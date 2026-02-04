import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { mentorados, mentorshipActionItems, mentorshipSessions, users } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const mentorshipRouter = router({
  /**
   * List all mentorship sessions for a mentorado
   */
  listByMentorado: protectedProcedure
    .input(
      z
        .object({
          mentoradoId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado ID
      let targetMentoradoId = ctx.mentorado?.id;

      if (input?.mentoradoId) {
        const isOwnId = input.mentoradoId === ctx.mentorado?.id;
        const isAdmin = ctx.user?.role === "admin";

        if (!isOwnId && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você só pode visualizar suas próprias sessões.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Perfil de mentorado não encontrado.",
        });
      }

      // Fetch sessions with mentor info
      const sessions = await db
        .select({
          session: mentorshipSessions,
          mentor: {
            id: users.id,
            name: users.name,
            email: users.email,
            imageUrl: users.imageUrl,
          },
        })
        .from(mentorshipSessions)
        .leftJoin(users, eq(mentorshipSessions.mentorId, users.id))
        .where(eq(mentorshipSessions.mentoradoId, targetMentoradoId))
        .orderBy(desc(mentorshipSessions.sessionDate));

      // Fetch action items for all sessions
      const sessionIds = sessions.map((s) => s.session.id);

      const actionItems =
        sessionIds.length > 0
          ? await db
              .select()
              .from(mentorshipActionItems)
              .where(inArray(mentorshipActionItems.sessionId, sessionIds))
              .orderBy(asc(mentorshipActionItems.createdAt))
          : [];

      // Group action items by session
      const actionItemsBySession = actionItems.reduce(
        (acc, item) => {
          if (!acc[item.sessionId]) {
            acc[item.sessionId] = [];
          }
          acc[item.sessionId].push(item);
          return acc;
        },
        {} as Record<number, typeof actionItems>
      );

      // Combine sessions with their action items
      return sessions.map((s) => ({
        ...s.session,
        mentor: s.mentor,
        actionItems: actionItemsBySession[s.session.id] || [],
      }));
    }),

  /**
   * Create a new mentorship session with action items (Admin only)
   */
  createSession: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        title: z.string().min(1).max(255),
        summary: z.string().min(1),
        sessionDate: z.string().datetime().optional(),
        actionItems: z
          .array(
            z.object({
              description: z.string().min(1),
              dueDate: z.string().date().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Permission check: Only admins can create sessions
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar sessões de mentoria.",
        });
      }

      // Verify mentorado exists
      const [mentorado] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId))
        .limit(1);

      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado.",
        });
      }

      // Create session and action items in a transaction
      return await db.transaction(async (tx) => {
        // Create session
        const [session] = await tx
          .insert(mentorshipSessions)
          .values({
            mentorId: ctx.user.id,
            mentoradoId: input.mentoradoId,
            title: input.title,
            summary: input.summary,
            sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
          })
          .returning();

        // Create action items if provided
        if (input.actionItems && input.actionItems.length > 0) {
          await tx.insert(mentorshipActionItems).values(
            input.actionItems.map((item) => ({
              sessionId: session.id,
              description: item.description,
              dueDate: item.dueDate || null,
              status: "pending" as const,
            }))
          );
        }

        return session;
      });
    }),

  /**
   * Update an existing mentorship session (Admin only)
   */
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        title: z.string().min(1).max(255).optional(),
        summary: z.string().min(1).optional(),
        sessionDate: z.string().datetime().optional(),
        actionItems: z
          .array(
            z.object({
              id: z.number().optional(),
              description: z.string().min(1),
              dueDate: z.string().date().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Permission check: Only admins
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar sessões.",
        });
      }

      // Verify session exists
      const [session] = await db
        .select()
        .from(mentorshipSessions)
        .where(eq(mentorshipSessions.id, input.sessionId))
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sessão não encontrada.",
        });
      }

      return await db.transaction(async (tx) => {
        // Update session fields
        const updateData: Partial<typeof mentorshipSessions.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (input.title) updateData.title = input.title;
        if (input.summary) updateData.summary = input.summary;
        if (input.sessionDate) updateData.sessionDate = new Date(input.sessionDate);

        const [updatedSession] = await tx
          .update(mentorshipSessions)
          .set(updateData)
          .where(eq(mentorshipSessions.id, input.sessionId))
          .returning();

        // Handle action items if provided
        if (input.actionItems) {
          // Get existing action items
          const existingItems = await tx
            .select()
            .from(mentorshipActionItems)
            .where(eq(mentorshipActionItems.sessionId, input.sessionId));

          const existingIds = existingItems.map((item) => item.id);
          const inputIds = input.actionItems
            .filter((item) => item.id)
            .map((item) => item.id as number);

          // Delete items not in input
          const idsToDelete = existingIds.filter((id) => !inputIds.includes(id));
          if (idsToDelete.length > 0) {
            await tx
              .delete(mentorshipActionItems)
              .where(inArray(mentorshipActionItems.id, idsToDelete));
          }

          // Update or create items
          for (const item of input.actionItems) {
            if (item.id) {
              // Update existing
              await tx
                .update(mentorshipActionItems)
                .set({
                  description: item.description,
                  dueDate: item.dueDate || null,
                  updatedAt: new Date(),
                })
                .where(eq(mentorshipActionItems.id, item.id));
            } else {
              // Create new
              await tx.insert(mentorshipActionItems).values({
                sessionId: input.sessionId,
                description: item.description,
                dueDate: item.dueDate || null,
                status: "pending",
              });
            }
          }
        }

        return updatedSession;
      });
    }),

  /**
   * Toggle action item status (Student can mark complete)
   */
  toggleActionItem: protectedProcedure
    .input(
      z.object({
        actionItemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Fetch action item with its session
      const [actionItem] = await db
        .select({
          actionItem: mentorshipActionItems,
          session: mentorshipSessions,
        })
        .from(mentorshipActionItems)
        .leftJoin(mentorshipSessions, eq(mentorshipActionItems.sessionId, mentorshipSessions.id))
        .where(eq(mentorshipActionItems.id, input.actionItemId))
        .limit(1);

      if (!actionItem || !actionItem.session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action item não encontrado.",
        });
      }

      // Permission check
      const isOwner = actionItem.session.mentoradoId === ctx.mentorado?.id;
      const isAdmin = ctx.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para modificar este action item.",
        });
      }

      // Toggle status
      const newStatus = actionItem.actionItem.status === "pending" ? "completed" : "pending";
      const completedAt = newStatus === "completed" ? new Date() : null;

      const [updated] = await db
        .update(mentorshipActionItems)
        .set({
          status: newStatus,
          completedAt,
          updatedAt: new Date(),
        })
        .where(eq(mentorshipActionItems.id, input.actionItemId))
        .returning();

      return updated;
    }),
});
