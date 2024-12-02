import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { evalite, Levenshtein } from "evalite-vitest";

evalite("Test basics", {
  data: async () => [
    {
      input: `What's the capital of France?`,
      expected: `Lille.`,
    },
    {
      input: `What's the capital of Germany?`,
      expected: `Berlin.`,
    },
    {
      input: `What's the capital of Italy?`,
      expected: `Rome.`,
    },
    {
      input: `What's the capital of the United States?`,
      expected: `Washington, D.C.`,
    },
  ],
  task: async (input) => {
    const result = await generateText({
      model: openai("gpt-3.5-turbo"),
      system: `
        Answer the question concisely, in as few words as possible.
      `,
      prompt: input,
    });

    return result.text;
  },
  scorers: [Levenshtein],
});