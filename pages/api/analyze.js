import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// EXTRAER JSON de un texto mezclado
function extractJSON(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { imageBase64 } = req.body;

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
                "Analiza esta cara y responde SOLO un JSON EXACTO con este formato: " +
                "{ \"emotion\": \"contento | enojado | somnoliento | triste | tranquilo\" }. " +
                "NO escribas nada fuera del JSON.",
            },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    // Extraer texto de la respuesta
    let text = "";
    ai.output[0].content.forEach((blk) => {
      if (blk.type === "output_text") text += blk.text;
    });

    console.log("RAW MODEL OUTPUT:", text);

    // EXTRAEMOS JSON aunque venga mezclado
    const parsed = extractJSON(text);

    const emotion = parsed?.emotion ?? "desconocido";

    return res.status(200).json({ emotion, raw: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "API error" });
  }
}
