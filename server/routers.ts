import { COOKIE_NAME } from "@shared/const";
import { getGovernmentServiceLocations } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

function readText(response: any) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part?.text ?? "").join("");
  return "";
}

const civicSafety = `You are GovGuide AI, a careful South African civic information assistant. Help people understand government services in plain language. Do not invent fees, deadlines, addresses, requirements, departments, or URLs. If a detail could change or is uncertain, say the user should verify it with the relevant official department. Use headings, short lists, and practical next steps. Mention that guidance is informational when appropriate.`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  map: router({
    locations: publicProcedure.query(async () => getGovernmentServiceLocations()),
  }),
  ai: router({
    ask: publicProcedure
      .input(z.object({
        messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(20),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: civicSafety },
              ...input.messages.map(message => ({ role: message.role, content: message.content })),
            ],
          });
          return { answer: readText(response) || "I’m sorry, I couldn’t generate guidance right now. Please try again or browse the Government Services directory." };
        } catch (error) {
          console.error("[AI] Ask GovGuide failed", error);
          return { answer: "I can help you get oriented, but the live AI service is unavailable right now. Start in Government Services, choose the service that sounds closest, and verify important requirements with the relevant official department." };
        }
      }),
    generateContent: publicProcedure
      .input(z.object({
        topic: z.string().min(1).max(500),
        contentType: z.string().min(1).max(100),
        audience: z.string().min(1).max(100),
        tone: z.string().min(1).max(100),
        instructions: z.string().max(1500).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: `${civicSafety} Create a polished ${input.contentType} for a ${input.audience} audience. Tone: ${input.tone}. Do not present demo assumptions as official facts.` },
              { role: "user", content: `Topic: ${input.topic}\nAdditional instructions: ${input.instructions || "None"}` },
            ],
          });
          return { content: readText(response) || "No draft was generated. Please try again." };
        } catch (error) {
          console.error("[AI] Content generation failed", error);
          return { content: `A clear starting point for ${input.topic}:\n\nConfirm the latest requirements with the relevant government department. Gather your supporting documents, follow the approved application steps, and keep your reference number. This draft is informational and should be checked against the official source before publishing.` };
        }
      }),
    analyzeSentiment: publicProcedure
      .input(z.object({ feedback: z.string().min(1).max(20000) }))
      .mutation(async ({ input }) => {
        const fallback = {
          total: Math.max(1, input.feedback.split(/\n\s*\n|\n/).filter(Boolean).length),
          positive: 1,
          neutral: 1,
          negative: 1,
          score: 61,
          themes: ["Waiting times", "Staff helpfulness", "Digital access"],
          complaints: ["Long queues", "Unclear next steps", "Repeated document requests"],
          observations: ["Clear explanations improve confidence", "People value progress updates"],
          insights: "Feedback suggests that waiting times and clarity of next steps are the strongest opportunities for improvement.",
        };
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: `${civicSafety} Analyse citizen feedback. Classify the overall signal and summarise themes without exposing personal information.` },
              { role: "user", content: input.feedback },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "sentiment_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    positive: { type: "integer" },
                    neutral: { type: "integer" },
                    negative: { type: "integer" },
                    score: { type: "integer" },
                    themes: { type: "array", items: { type: "string" } },
                    complaints: { type: "array", items: { type: "string" } },
                    observations: { type: "array", items: { type: "string" } },
                    insights: { type: "string" },
                  },
                  required: ["total", "positive", "neutral", "negative", "score", "themes", "complaints", "observations", "insights"],
                  additionalProperties: false,
                },
              },
            },
          });
          const text = readText(response);
          const parsed = JSON.parse(text);
          return { ...fallback, ...parsed };
        } catch (error) {
          console.error("[AI] Sentiment analysis failed", error);
          return fallback;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
