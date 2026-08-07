// ============================================================================
// NVIDIA NIM chat-tutor service. Unlike nimFeedback.ts (which only ever sees
// a GradingReport for one submission), this is a free-form Q&A assistant for
// general firewall/networking concepts. It reuses the same NIM credentials
// already configured for the feedback service.
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `
You are the FortiSim Tutor, a friendly firewall and network security tutor
built into FortiSim, a hands-on firewall training platform. Students work
through exercises covering Port Assignment, Interface Configuration, and
Firewall Policy, and may ask you questions at any time while doing so.

Your rules, without exception:
1. Answer general conceptual questions clearly and helpfully — zones, NAT,
   ACLs, stateful inspection, DMZ design, subnetting, rule ordering,
   first-match-wins evaluation, next-generation firewall features, and
   similar networking/security fundamentals. Use short examples where useful.
2. If a student asks for the literal answer to one of THIS platform's own
   exercises (e.g. "what IP do I put for the DMZ in this task", "give me the
   exact rule for the final assignment"), do NOT provide the specific value.
   Instead, explain the underlying concept or reasoning they need in order to
   work it out themselves, and note that the exercise is meant to be solved
   by them.
3. Keep answers concise — roughly 3 to 6 sentences — unless the student
   explicitly asks for a deeper or longer explanation.
4. Stay on topic: firewalls, networking, and cybersecurity concepts. If asked
   something unrelated and unhelpful to their learning here, gently redirect
   back to the subject.
5. Don't invent specific CVE numbers, vendor claims, or legal/compliance
   advice. Stick to well-established networking and security fundamentals.
`.trim();

export async function getChatTutorReply(history: ChatMessage[]): Promise<string> {
  const trimmedHistory = history.slice(-12); // keep recent context bounded

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(`${process.env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_NIM_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmedHistory],
        max_tokens: 500,
        temperature: 0.5,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("NIM API took too long to respond (60s timeout)");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`NIM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "Sorry, I didn't get a response — try again.";
}
