import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { invokeLLM } from "./_core/llm";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

const mockedInvokeLLM = vi.mocked(invokeLLM);

function createCaller() {
  const ctx: TrpcContext = {
    user: undefined,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

function response(content: string) {
  return { choices: [{ message: { content } }] } as any;
}

describe("GovGuide AI procedures", () => {
  beforeEach(() => {
    mockedInvokeLLM.mockReset();
  });

  it("returns a grounded Ask GovGuide response", async () => {
    mockedInvokeLLM.mockResolvedValueOnce(response("Start by checking the CIPC requirements and official application channel."));
    const result = await createCaller().ai.ask({
      messages: [{ role: "user", content: "How do I register a company?" }],
    });

    expect(result.answer).toContain("CIPC requirements");
    expect(mockedInvokeLLM).toHaveBeenCalledOnce();
  });

  it("generates civic content from a structured brief", async () => {
    mockedInvokeLLM.mockResolvedValueOnce(response("A short, plain-language service explanation."));
    const result = await createCaller().ai.generateContent({
      topic: "Business registration",
      contentType: "Government Service Explanation",
      audience: "General Public",
      tone: "Simple",
      instructions: "Use a short checklist",
    });

    expect(result.content).toBe("A short, plain-language service explanation.");
    expect(mockedInvokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
  });

  it("parses structured sentiment analysis output", async () => {
    mockedInvokeLLM.mockResolvedValueOnce(response(JSON.stringify({
      total: 3,
      positive: 1,
      neutral: 1,
      negative: 1,
      score: 66,
      themes: ["Waiting times"],
      complaints: ["Long queues"],
      observations: ["Helpful explanations"],
      insights: "Waiting times are the clearest opportunity for improvement.",
    })));
    const result = await createCaller().ai.analyzeSentiment({ feedback: "The queue was long.\n\nThe staff were helpful.\n\nIt was okay." });

    expect(result).toMatchObject({ total: 3, score: 66, themes: ["Waiting times"] });
  });
});
