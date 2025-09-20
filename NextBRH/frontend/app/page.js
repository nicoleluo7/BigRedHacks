"use client";

import { useEffect, useState, useRef } from "react";

export default function HomePage() {
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");
    setWs(socket);

    socket.onopen = () => {
      setNotifications((prev) => [...prev, "Connected to MCP server"]);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "action_executed") {
        setNotifications((prev) => [
          ...prev,
          `Action executed for gesture: ${data.gesture}`,
        ]);
      } else if (data.status === "error") {
        setNotifications((prev) => [...prev, `Error: ${data.error}`]);
      }
    };

    socket.onerror = (err) => {
      console.error(err);
      setNotifications((prev) => [...prev, "WebSocket error"]);
    };

    return () => socket.close();
  }, []);

  const sendGesture = (gesture) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ gesture }));
      setNotifications((prev) => [...prev, `Sent gesture: ${gesture}`]);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setNotifications((prev) => [...prev, "Camera opened"]);

      // Send camera frames to backend
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const sendFrame = () => {
        if (!videoRef.current || !ws || ws.readyState !== WebSocket.OPEN)
          return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5); // compress
        ws.send(JSON.stringify({ type: "frame", data: dataUrl }));

        requestAnimationFrame(sendFrame);
      };

      sendFrame();
    } catch (err) {
      console.error("Error opening camera:", err);
      setNotifications((prev) => [...prev, "Failed to open camera"]);
    }
  };

  const gestureButtons = [
    {
      gesture: "thumbs_up",
      label: "Thumbs Up",
      description: "Opens Google",
      color: "green",
    },
    {
      gesture: "shaka",
      label: "Shaka",
      description: "Opens Spotify",
      color: "blue",
    },
    {
      gesture: "fist",
      label: "Fist",
      description: "Opens Notepad",
      color: "red",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Gesture Control Dashboard</h1>

      <div className="flex gap-6 mb-6 flex-wrap justify-center">
        {gestureButtons.map((btn) => (
          <div key={btn.gesture} className="flex flex-col items-center">
            <button
              onClick={() => sendGesture(btn.gesture)}
              className={`px-6 py-3 text-black cursor-pointer rounded hover:brightness-110 bg-${btn.color}-500`}
            >
              {btn.label}
            </button>
            <p className="text-center text-gray-700 text-sm mt-2 max-w-xs">
              {btn.description}
            </p>
          </div>
        ))}

        <div className="flex flex-col items-center">
          <button
            onClick={openCamera}
            className="px-6 py-3 text-white rounded hover:brightness-110 bg-purple-500"
          >
            Open Camera
          </button>
          <p className="text-center text-gray-700 text-sm mt-2 max-w-xs">
            Opens your webcam and sends frames to the backend
          </p>
        </div>
      </div>

      <video
        ref={videoRef}
        className="w-80 h-60 bg-black rounded shadow mb-6"
        autoPlay
        muted
      />

      <div className="w-full max-w-md p-4 bg-white rounded shadow space-y-2">
        <h2 className="font-semibold text-lg mb-2">Notifications</h2>
        {notifications.map((note, i) => (
          <p key={i} className="text-gray-700 text-sm">
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}
