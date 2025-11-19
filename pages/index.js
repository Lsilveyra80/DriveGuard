import { useEffect, useRef, useState } from "react";
import * as mpFace from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCanvasRef = useRef(null);

  const [emotion, setEmotion] = useState("Detectando...");
  const [lastSent, setLastSent] = useState(0);

  // 1. Inicializar MediaPipe Face Detection
  useEffect(() => {
    const faceDetection = new mpFace.FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: "short", // más rápido
      minDetectionConfidence: 0.6,
    });

    faceDetection.onResults(onFaceResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceDetection.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    }
  }, []);

  // 2. Procesar detección de rostros y recortar el rostro
  const onFaceResults = async (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 640;
    canvas.height = 480;

    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.detections || results.detections.length === 0) {
      setEmotion("No se detecta rostro");
      return;
    }

    const detection = results.detections[0];
    const box = detection.boundingBox;

    // Recortar rostro en un canvas separado
    const faceCanvas = faceCanvasRef.current;
    const fctx = faceCanvas.getContext("2d");

    faceCanvas.width = box.width;
    faceCanvas.height = box.height;

    fctx.drawImage(
      results.image,
      box.xCenter - box.width / 2,
      box.yCenter - box.height / 2,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height
    );

    // Enviar cada 300ms
    if (Date.now() - lastSent > 300) {
      sendFaceToAPI();
      setLastSent(Date.now());
    }
  };

  // 3. Convertir a Base64 y mandar al backend /api/analyze
  const sendFaceToAPI = async () => {
    const faceCanvas = faceCanvasRef.current;

    const base64 = faceCanvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      setEmotion(data.emotion || "desconocido");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Detección emocional en tiempo real</h1>
      <p><strong>Emoción:</strong> {emotion}</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: 640, height: 480, borderRadius: 8 }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <canvas ref={faceCanvasRef} style={{ display: "none" }} />
    </div>
  );
}
