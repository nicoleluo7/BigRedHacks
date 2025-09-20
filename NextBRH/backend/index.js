const WebSocket = require("ws");
const open = require("open");
const { exec } = require("child_process");

const PORT = 3001;
const wss = new WebSocket.Server({ port: PORT });

function handleGesture(gesture) {
  switch (gesture) {
    case "thumbs_up":
      open("https://www.google.com");
      break;
    case "shaka":
      exec("start spotify");
      break;
    case "fist":
      exec("start notepad");
      break;
    default:
      console.log(`No action mapped for gesture: ${gesture}`);
  }
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.gesture) {
        console.log("Received gesture:", data.gesture);
        handleGesture(data.gesture);
        ws.send(
          JSON.stringify({ status: "action_executed", gesture: data.gesture })
        );
      } else if (data.type === "frame") {
        // Here you can process camera frames
        console.log("Received camera frame, size:", data.data.length);
        // e.g., save frame or run gesture recognition model
      }
    } catch (err) {
      console.error(err);
      ws.send(JSON.stringify({ status: "error", error: err.message }));
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});

console.log(`MCP server running on ws://localhost:${PORT}`);
