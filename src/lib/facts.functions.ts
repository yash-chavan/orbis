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

const SYSTEM_PROMPT =
  "You are an unhinged, hilarious travel & exploration guide. Output strictly valid JSON with no markdown block wrappers matching this schema: " +
  '{"vibeSummary":"2 short punchy sentences summarizing what standing here right now feels like based on the live weather.","bizarreFact":"1 jaw-dropping, lesser-known historical fact, geological anomaly, or strange trivia about this area.","localFood":"Must-try iconic local street food OR (if in wild/ocean) a famous local survival snack / native plant.","localSlang":"1 real local slang word/phrase OR (if in wild/ocean) a fun wilderness/survival rule."}';

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

export const getFacts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ facts: Facts; source: "ai" | "fallback" }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { facts: mock(data), source: "fallback" };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(data) },
          ],
        }),
      });
      if (!res.ok) return { facts: mock(data), source: "fallback" };
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content ?? "";
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
