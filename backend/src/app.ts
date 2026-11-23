import express, { type Request, type Response } from "express";
import cors from "cors";
import { aiService, sessionService } from "./services/index.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

// Sample greet API
app.get("/api/greet", (req: Request, res: Response) => {
  const name = (req.query.name as string) || "Guest";
  res.json({
    message: `Hello, ${name}! Welcome to the API.`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/session
 * Creates or resets an in-memory session (identified by uniq_id)
 * where the LLM context (dictionary) and messages are stored.
 */
app.post("/api/session", (req: Request, res: Response) => {
  const uniq_id = (req.body?.uniq_id || req.body?.sessionId || req.query?.uniq_id || req.query?.sessionId) as string | undefined;
  const initialContext = req.body?.context && typeof req.body.context === "object" ? req.body.context : {};
  const isExisting = Boolean(uniq_id && sessionService.getSession(uniq_id));

  const session = sessionService.createOrResetSession(uniq_id, initialContext);

  res.status(200).json({
    success: true,
    uniq_id: session.uniq_id,
    sessionId: session.uniq_id,
    message: isExisting
      ? `Session '${session.uniq_id}' reset successfully`
      : `Session '${session.uniq_id}' created successfully`,
    context: session.context,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
});

/**
 * GET /api/session
 * Optional helper to inspect an in-memory session or list all sessions.
 */
app.get("/api/session", (req: Request, res: Response) => {
  const uniq_id = (req.query?.uniq_id || req.query?.sessionId) as string | undefined;
  if (uniq_id) {
    const session = sessionService.getSession(uniq_id);
    if (!session) {
      return res.status(404).json({
        error: `Session '${uniq_id}' not found`,
      });
    }
    return res.json({ success: true, session });
  }

  res.json({
    success: true,
    sessions: sessionService.getAllSessions(),
  });
});

/**
 * POST /api/chat
 * Takes req.body.text, associates it with the in-memory session context,
 * passes it to the LLM, and returns the response.
 */
app.post("/api/chat", async (req: Request, res: Response) => {
  const text = req.body?.text;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({
      error: "Field 'text' is required and must be a non-empty string in request body.",
    });
  }

  try {
    const uniq_id = (req.body?.uniq_id || req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const session = sessionService.getOrCreateSession(uniq_id);

    // Append user message to conversation history
    session.messages.push({
      role: "user",
      content: text.trim(),
    });

    // Pass conversation messages and tools to LLM
    const aiResponse = await aiService.chat(session.messages);

    // If tools were executed, update session messages to preserve conversation with tool history
    if (aiResponse.conversation && aiResponse.conversation.length > 0) {
      session.messages = aiResponse.conversation.filter((m) => m.role !== "system");
    }

    // Append assistant response to conversation history
    session.messages.push({
      role: "assistant",
      content: JSON.stringify({
        speech: aiResponse.speech,
        details: aiResponse.details,
      }),
    });

    // Update in-memory session context dictionary with tool call results
    session.updatedAt = new Date();
    session.context = {
      ...session.context,
      lastPrompt: text.trim(),
      lastResponse: aiResponse,
      lastUpdated: new Date().toISOString(),
      messageCount: session.messages.length,
      ...(aiResponse.toolResults || {}),
    };
    if (aiResponse.toolResults?.get_bank_cards) {
      session.context.cards = aiResponse.toolResults.get_bank_cards;
    }
    if (aiResponse.toolResults?.get_bank_services) {
      session.context.services = aiResponse.toolResults.get_bank_services;
    }

    // Return the response
    return res.json({
      uniq_id: session.uniq_id,
      sessionId: session.uniq_id,
      speech: aiResponse.speech,
      details: aiResponse.details,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({
      error: "Internal server error while processing chat message",
      message: error?.message || String(error),
    });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "API server is running" });
});

export default app;
