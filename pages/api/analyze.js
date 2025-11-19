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
                "Analiza la expresión facial de la persona en la imagen y responde únicamente en un JSON con este formato: " +
                "{ \"emotion\": \"contento | enojado | somnoliento | triste | tranquilo\" }. " +
                "Define las emociones así: " +
                "- contento: sonrisa leve o marcada, ojos abiertos normales " +
                "- enojado: cejas fruncidas, tensión en mandíbula, boca apretada " +
                "- somnoliento: ojos semicerrados, cabeza inclinada, expresión apagada " +
                "- triste: comisuras hacia abajo, ojos caídos, expresión apagada pero no cansada " +
                "- tranquilo: cara neutra sin señales claras de las anteriores. " +
                "No escribas explicaciones. No agregues texto extra. SOLO el JSON.",
            },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    // EXTRAER TEXTO
    let text = "";
    if (ai.output && ai.output[0] && ai.output[0].content) {
      for (const block of ai.output[0].content) {
        if (block.type === "output_text") {
          text += block.text;
        }
      }
    }

    console.log("RAW MODEL OUTPUT:", text);

    // Intentar parsear JSON
    let emotion = "desconocido";
    try {
      const parsed = JSON.parse(text);
      emotion = parsed.emotion || "desconocido";
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    return res.status(200).json({ emotion, raw: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "API error" });
  }
}

