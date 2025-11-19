import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const [emotion, setEmotion] = useState("Detectando...");
  const faceLandmarkerRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    async function init() {
      // Esperar a que cargue MediaPipe desde el script
      const wait = () =>
        new Promise((resolve) => {
          const check = () => {
            if (window.FilesetResolver && window.FaceLandmarker) resolve();
            else setTimeout(check, 50);
          };
          check();
        });

      await wait();

      const vision = await window.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      const faceLandmarker = await window.FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );

      faceLandmarkerRef.current = faceLandmarker;

      // iniciar webcam
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          requestAnimationFrame(detectFrame);
        };
      });
    }

    init();
  }, []);

  const detectFrame = async () => {
    const faceLandmarker = faceLandmarkerRef.current;
    if (!faceLandmarker) {
      requestAnimationFrame(detectFrame);
      return;
    }

    const video = videoRef.current;

    const results = faceLandmarker.detectForVideo(video, performance.now());

    if (!results.faceLandmarks?.length) {
      setEmotion("No se detecta rostro");
      requestAnimationFrame(detectFrame);
      return;
    }

    const landmarks = results.faceLandmarks[0];

    // bounding box automático
    const xs = landmarks.map((p) => p.x);
    const ys = landmarks.map((p) => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const w = video.videoWidth;
    const h = video.videoHeight;

    const x = minX * w;
    const y = minY * h;
    const width = (maxX - minX) * w;
    const height = (maxY - minY) * h;

    const faceCanvas = faceCanvasRef.current;
    const ctx = faceCanvas.getContext("2d");

    faceCanvas.width = width;
    faceCanvas.height = height;

    ctx.drawImage(video, x, y, width, height, 0, 0, width, height);

    // Enviar cada 300ms
    if (Date.now() - lastSentRef.current > 300) {
      lastSentRef.current = Date.now();
      sendFaceToAPI();
    }

    requestAnimationFrame(detectFrame);
  };

  const sendFaceToAPI = async () => {
    const base64 = faceCanvasRef.current.toDataURL("image/jpeg");

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
      <h2>Emoción: {emotion}</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: 640, height: 480, borderRadius: 10 }}
      />

      <canvas ref={faceCanvasRef} style={{ display: "none" }} />
    </div>
  );
}
