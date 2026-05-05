import { type NextRequest } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { isLocale, type Locale } from "~/lib/i18n/config";
import { logger } from "~/lib/logger";
import { clientIp } from "~/lib/rate-limit";
import { getCurrentSession } from "~/server/providers/auth";
import { getAIProvider } from "~/server/providers/ai";
import { prisma } from "~/server/db/client";
import { enforceAnonRate, enforceUserBudget, recordTokens } from "~/server/services/concierge-budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  sessionId: z.string().min(1).max(80),
  locale: z.string().refine(isLocale).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBodyWith(request, Body);
    const session = await getCurrentSession();
    if (session) {
      await enforceUserBudget({ userId: session.user.id, isPremium: session.user.premium });
    } else {
      enforceAnonRate(clientIp(request));
    }

    const locale: Locale = (body.locale as Locale | undefined) ?? "tr";

    // Persist the user message
    const lastUser = body.messages[body.messages.length - 1];
    if (lastUser && session) {
      await prisma.conciergeMessage.create({
        data: {
          sessionId: body.sessionId,
          userId: session.user.id,
          role: "user",
          content: lastUser.content,
        },
      });
    }

    const provider = getAIProvider();
    const encoder = new TextEncoder();
    let assistantBuffer = "";
    let citations: { slug: string; name: string }[] = [];
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of provider.stream({
            messages: body.messages,
            locale,
            sessionId: body.sessionId,
            isPremium: !!session?.user.premium,
            ...(session?.user.id ? { userId: session.user.id } : {}),
          })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            if (chunk.type === "text") assistantBuffer += chunk.delta;
            if (chunk.type === "citation") citations.push({ slug: chunk.slug, name: chunk.name });
            if (chunk.type === "tokens" && session) {
              await recordTokens({
                userId: session.user.id,
                tokens: Math.ceil(chunk.input + chunk.output),
              });
            }
            if (chunk.type === "done") {
              if (session) {
                await prisma.conciergeMessage.create({
                  data: {
                    sessionId: body.sessionId,
                    userId: session.user.id,
                    role: "assistant",
                    content: assistantBuffer,
                    citations: citations.length > 0 ? JSON.stringify(citations) : null,
                  },
                });
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "end" })}\n\n`));
              controller.close();
              return;
            }
          }
          controller.close();
        } catch (err) {
          logger.warn({ err }, "concierge stream error");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Stream failed" })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return problem(err, request.url);
  }
}
