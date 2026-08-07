// ============================================================================
// POST /api/chat-tutor
// Body: { messages: ChatMessage[] } — the running conversation so far,
// ending in the student's latest message. Returns { reply }.
// ============================================================================

import { Router } from "express";
import { getChatTutorReply, ChatMessage } from "../services/chatTutorService";

export const chatTutorRouter = Router();

chatTutorRouter.post("/", async (req, res) => {
  const messages = req.body?.messages as ChatMessage[] | undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty messages array" });
  }

  try {
    const reply = await getChatTutorReply(messages);
    res.json({ reply });
  } catch (err) {
    console.error("Chat tutor request failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Tutor service unavailable: ${detail}` });
  }
});
