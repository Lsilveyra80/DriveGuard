// pages/api/analyze.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto a analizar" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un modelo que analiza el estado de alerta/somnolencia en base a la descripción del usuario.",
        },
        { role: "user", content: text },
      ],
    });

    const result = completion.choices[0].message.content;
    return res.status(200).json({ analysis: result });
  } catch (error) {
    console.error("Error en OpenAI:", error);
    return res.status(500).json({ error: "Error al procesar el análisis" });
  }
}
