// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Esperando cámara...");
  const [isAlarmOn, setIsAlarmOn] = useState(false);
  const alarmAudioRef = useRef(null);

  useEffect(() => {
    // Pedir acceso a la cámara
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("Cámara iniciada. Analizando...");
      } catch (err) {
        console.error(err);
        setStatus("Error al acceder a la cámara");
      }
    }

    initCamera();
  }, []);

  useEffect(() => {
    // Cada X segundos tomar captura y enviar a la API
    const interval = setInterval(() => {
      captureAndAnalyze();
    }, 8000); // cada 8 segundos, ajusta a gusto

    return () => clearInterval(interval);
  });

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.readyState !== 4) return; // no está listo el video aún

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setStatus("Analizando...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      const data = await res.json();

      if (data.state === "sleepy") {
        setStatus("Estado: SOMNOLIENTO 😴");
        triggerAlarm();
      } else if (data.state === "awake") {
        setStatus("Estado: DESPIERTO 😁");
        stopAlarm();
      } else {
        setStatus("Estado: desconocido 🤔");
      }
    } catch (error) {
      console.error(error);
      setStatus("Error al analizar la imagen");
    }
  };

  const triggerAlarm = () => {
    setIsAlarmOn(true);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.loop = true;
      alarmAudioRef.current.play().catch((e) => console.log(e));
    }
  };

  const stopAlarm = () => {
    setIsAlarmOn(false);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1>Análisis de somnolencia con IA</h1>
      <p>Si la IA detecta que te estás durmiendo, sonará una alarma 🔔</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "320px",
          height: "240px",
          background: "#000",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p style={{ marginTop: "20px", fontSize: "18px" }}>{status}</p>

      <button
        onClick={captureAndAnalyze}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Analizar ahora
      </button>

      <audio
        ref={alarmAudioRef}
        src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
      />

      {isAlarmOn && <p style={{ color: "red", marginTop: "10px" }}>⚠️ ¡ALARMA ACTIVADA!</p>}
    </div>
  );
}
