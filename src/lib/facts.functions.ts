import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  city: z.string().nullable(),
  country: z.string().nullable(),
  temperature: z.number(),
  weatherCondition: z.string(),
  localTime: z.string(),
  isWilderness: z.boolean(),
  isOcean: z.boolean(),
});

export type Facts = {
  vibeSummary: string;
  bizarreFact: string;
  localFood: string;
  localSlang: string;
};

const SYSTEM_PROMPT = [
  "You are a witty, casual travel companion. Never dramatic, never a textbook, never verbose.",
  "Output strictly valid JSON, no markdown fences, matching this schema:",
  '{"vibeSummary":"","bizarreFact":"","localFood":"","localSlang":""}',
  "Field rules:",
  "- vibeSummary: STRICTLY 1-2 punchy sentences about the live weather here right now. Witty, casual, relatable, like texting a friend. Max 35 words.",
  "- bizarreFact: a fascinating conversational hook about this place. Clear, active language, present tense, hooks the reader in the first 6 words. 2 sentences max, no dates-dump, no encyclopedia tone.",
  "- localFood: one must-try local dish or snack (or wild/ocean survival food). Snappy and appetite-inducing. 1-2 short sentences.",
  "- localSlang: one real local slang word/phrase with a fun plain-English meaning (or a wilderness/ocean survival rule). 1-2 short sentences.",
  "Fallback rule: if the exact city/town is obscure or you have no reliable material for it, do NOT say so and never invent facts about it. Instead write rich, witty, accurate content about the surrounding state, region or country, and mention that wider place by name naturally.",
].join("\n");

function mock(data: z.infer<typeof Input>): Facts {
  if (data.isOcean) {
    return {
      vibeSummary: `You are bobbing in open water at ${Math.round(data.temperature)}°C with ${data.weatherCondition.toLowerCase()} overhead. Your only neighbours have gills and opinions.`,
      bizarreFact:
        "We have better maps of the surface of Mars than of the ocean floor beneath you — over 80% of it has never been seen by human eyes.",
      localFood:
        "Sea lettuce and barnacles: chewy, salty, and technically survival cuisine. Sailors swore by lime slices to dodge scurvy.",
      localSlang:
        "Wilderness rule: never drink seawater. It dehydrates you faster than the thirst it pretends to fix.",
    };
  }
  if (data.isWilderness) {
    return {
      vibeSummary: `Nothing but horizon, ${data.weatherCondition.toLowerCase()} skies and ${Math.round(data.temperature)}°C of raw planet. Your phone bars are a rumour out here.`,
      bizarreFact:
        "Remote landscapes like this often sit on rock older than multicellular life — some crust here predates the first tree by over a billion years.",
      localFood:
        "Foragers' pick: wild berries and edible roots. Rule of thumb — if it's bitter and no bird eats it, neither should you.",
      localSlang:
        "Wilderness rule of threes: three minutes without air, three days without water, three weeks without food.",
    };
  }
  return {
    vibeSummary: `${data.city ?? "This spot"} is running ${Math.round(data.temperature)}°C and ${data.weatherCondition.toLowerCase()} right now. Perfect weather for pretending you meant to end up here.`,
    bizarreFact:
      "Every city hides at least one abandoned tunnel that officials insist does not exist — and locals will happily point you to the entrance.",
    localFood:
      "Follow the longest queue of locals at the busiest street cart. That queue is never wrong.",
    localSlang:
      "Learn 'thank you' in the local tongue first — it unlocks smiles, directions, and occasionally free food.",
  };
}

async function callGemini(key: string, payload: unknown): Promise<string> {
  const models = ["gemini-1.5-flash"];
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
          generationConfig: { temperature: 1, responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (text.trim()) return text;
  }
  return "";
}

export const getFacts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ facts: Facts; source: "ai" | "fallback" }> => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) return { facts: mock(data), source: "fallback" };
    try {
      const raw = await callGemini(key, data);
      if (!raw) return { facts: mock(data), source: "fallback" };
      const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return { facts: mock(data), source: "fallback" };
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<Facts>;
      const fb = mock(data);
      return {
        facts: {
          vibeSummary: parsed.vibeSummary || fb.vibeSummary,
          bizarreFact: parsed.bizarreFact || fb.bizarreFact,
          localFood: parsed.localFood || fb.localFood,
          localSlang: parsed.localSlang || fb.localSlang,
        },
        source: "ai",
      };
    } catch {
      return { facts: mock(data), source: "fallback" };
    }
  });
