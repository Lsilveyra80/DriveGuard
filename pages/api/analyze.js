import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }

  try {
    const ai = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Look at this face and reply ONLY one word: 'awake' or 'sleepy'. " +
                "No sentences, no emojis, no punctuation, only that word.",
            },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    // EXTRAER TEXTO DE RESPUESTA
    let text = "";

    if (ai.output && ai.output[0] && ai.output[0].content) {
      for (const block of ai.output[0].content) {
        if (block.type === "output_text") {
          text += block.text;
        }
      }
    }

    const raw = text.trim().toLowerCase();
    console.log("RAW MODEL OUTPUT:", raw);

    let state = "unknown";

    if (raw.startsWith("awake")) state = "awake";
    if (raw.startsWith("sleepy")) state = "sleepy";

    return res.status(200).json({ state, raw });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "API error" });
  }
}
