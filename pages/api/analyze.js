import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
                "Analiza esta cara y responde SOLO un JSON: " +
                "{ \"emotion\": \"contento | enojado | somnoliento | triste | tranquilo\" }. " +
                "Definiciones precisas: " +
                "contento: sonrisa, mejillas levantadas, ojos relajados. " +
                "enojado: cejas fruncidas, mandíbula tensa. " +
                "somnoliento: ojos semicerrados, cabeza baja. " +
                "triste: comisuras hacia abajo, ojos caídos. " +
                "tranquilo: expresión neutral. " +
                "No agregues texto fuera del JSON.",
            },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    let text = "";
    ai.output[0].content.forEach((blk) => {
      if (blk.type === "output_text") text += blk.text;
    });

    let emotion = "desconocido";
    try {
      emotion = JSON.parse(text).emotion;
    } catch {}

    res.status(200).json({ emotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API error" });
  }
}
