// pages/api/analyze.js
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
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un clasificador de estado de vigilia. Solo responde con 'awake' o 'sleepy'.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analiza si la persona en esta imagen está despierta o somnolienta.",
            },
            {
              type: "input_image",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 5,
    });

    const raw = response.choices[0].message.content.trim().toLowerCase();

    let state = "unknown";
    if (raw.includes("sleepy") || raw.includes("somnoliento") || raw.includes("somnolienta")) {
      state = "sleepy";
    } else if (raw.includes("awake") || raw.includes("despierto") || raw.includes("despierta")) {
      state = "awake";
    }

    return res.status(200).json({ state, raw });
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: "Error analyzing image" });
  }
}
