#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import { spawn, exec } from "child_process";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GestureRecognitionMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "gesture-recognition-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.gestureMappings = new Map();
    this.connectedClients = new Set();
    this.wsServer = null;
    this.httpServer = null;
    this.configPath = join(__dirname, "..", "config", "gesture-mappings.json");

    this.setupMCPHandlers();
    this.loadGestureMappings();
    this.setupWebSocketServer();
    this.setupHttpServer();
  }

  setupMCPHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "gesture://mappings",
            name: "Gesture Mappings",
            description: "Current gesture-to-action mappings",
            mimeType: "application/json",
          },
          {
            uri: "gesture://available-actions",
            name: "Available Actions",
            description: "List of available system actions",
            mimeType: "application/json",
          },
          {
            uri: "gesture://detected-gestures",
            name: "Detected Gestures",
            description: "Recent gesture detection events",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Read resource content
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case "gesture://mappings":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(
                    Object.fromEntries(this.gestureMappings),
                    null,
                    2
                  ),
                },
              ],
            };

          case "gesture://available-actions":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.getAvailableActions(), null, 2),
                },
              ],
            };

          case "gesture://detected-gestures":
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.getRecentGestures(), null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      }
    );

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "perform_action",
            description: "Execute a system action based on detected gesture",
            inputSchema: {
              type: "object",
              properties: {
                gesture: {
                  type: "string",
                  description: "The detected gesture name",
                },
                timestamp: {
                  type: "string",
                  description: "When the gesture was detected",
                },
              },
              required: ["gesture", "timestamp"],
            },
          },
          {
            name: "update_mapping",
            description: "Update gesture-to-action mapping",
            inputSchema: {
              type: "object",
              properties: {
                gesture: {
                  type: "string",
                  description: "The gesture name",
                },
                action: {
                  type: "string",
                  description: "The action to execute",
                },
                actionParams: {
                  type: "object",
                  description: "Parameters for the action",
                },
              },
              required: ["gesture", "action"],
            },
          },
          {
            name: "get_gestures",
            description: "Get all available gestures and their mappings",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "broadcast_gesture",
            description: "Broadcast gesture detection to all connected clients",
            inputSchema: {
              type: "object",
              properties: {
                gesture: {
                  type: "string",
                  description: "The detected gesture",
                },
                timestamp: {
                  type: "string",
                  description: "Detection timestamp",
                },
                action: {
                  type: "string",
                  description: "Action that was triggered",
                },
              },
              required: ["gesture", "timestamp"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "perform_action":
          return await this.performAction(args);

        case "update_mapping":
          return await this.updateMapping(args);

        case "get_gestures":
          return await this.getGestures();

        case "broadcast_gesture":
          return await this.broadcastGesture(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async performAction(args) {
    const { gesture, timestamp } = args;

    console.log(`Performing action for gesture: ${gesture}`);

    const mapping = this.gestureMappings.get(gesture);
    if (!mapping) {
      return {
        content: [
          {
            type: "text",
            text: `No mapping found for gesture: ${gesture}`,
          },
        ],
      };
    }

    try {
      const result = await this.executeSystemAction(
        mapping.action,
        mapping.params || {}
      );

      // Broadcast the gesture detection to all connected clients
      await this.broadcastGesture({
        gesture,
        timestamp,
        action: mapping.action,
        success: true,
        result,
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully executed ${mapping.action} for gesture ${gesture}: ${result}`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error executing action for gesture ${gesture}:`, error);

      await this.broadcastGesture({
        gesture,
        timestamp,
        action: mapping.action,
        success: false,
        error: error.message,
      });

      return {
        content: [
          {
            type: "text",
            text: `Error executing action for gesture ${gesture}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async executeSystemAction(action, params = {}) {
    switch (action) {
      case "open_tab":
        return await this.openBrowserTab(
          params.url || "https://www.netflix.com"
        );

      case "open_app":
        return await this.openApplication(params.appName || "Calculator");

      case "facetime_call":
        return await this.makeFaceTimeCall(params.phoneNumber);

      case "volume_up":
        return await this.adjustVolume(5);

      case "volume_down":
        return await this.adjustVolume(-5);

      case "mute":
        return await this.setMute(true);

      case "unmute":
        return await this.setMute(false);

      case "screenshot":
        return await this.takeScreenshot();

      case "notification":
        return await this.sendNotification(
          params.message || "Gesture detected!"
        );

      case "custom_command":
        return await this.executeCustomCommand(params.command);

      case "spotify_play_pause":
        return await this.spotifyPlayPause();

      case "spotify_next":
        return await this.spotifyNext();

      case "spotify_previous":
        return await this.spotifyPrevious();

      case "close_tab":
        return await this.closeLastTab();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async openBrowserTab(url) {
    return new Promise((resolve, reject) => {
      const command =
        process.platform === "darwin"
          ? `open "${url}"`
          : process.platform === "win32"
          ? `start "${url}"`
          : `xdg-open "${url}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Opened browser tab: ${url}`);
        }
      });
    });
  }

  async openApplication(appName) {
    return new Promise((resolve, reject) => {
      let command;

      switch (process.platform) {
        case "darwin":
          command = `open -a "${appName}"`;
          break;
        case "win32":
          command = `start "" "${appName}"`;
          break;
        default:
          command = `${appName}`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Opened application: ${appName}`);
        }
      });
    });
  }

  async makeFaceTimeCall(phoneNumber) {
    return new Promise((resolve, reject) => {
      if (!phoneNumber) {
        reject(new Error("Phone number is required for FaceTime call"));
        return;
      }

      let command;

      if (process.platform === "darwin") {
        // Use the facetime:// URL scheme to initiate a FaceTime call
        command = `open "facetime://${phoneNumber}"`;
      } else {
        reject(new Error("FaceTime calls are only supported on macOS"));
        return;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Initiated FaceTime call to ${phoneNumber}`);
        }
      });
    });
  }

  async adjustVolume(delta) {
    return new Promise((resolve, reject) => {
      let command;

      if (process.platform === "darwin") {
        command = `osascript -e "set volume output volume (output volume of (get volume settings) + ${delta})"`;
      } else if (process.platform === "win32") {
        // Windows volume control would need additional tools
        command = `echo Volume adjustment not implemented for Windows`;
      } else {
        command = `amixer set Master ${delta > 0 ? "+" : ""}${delta}%`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Adjusted volume by ${delta}`);
        }
      });
    });
  }

  async setMute(muted) {
    return new Promise((resolve, reject) => {
      let command;

      if (process.platform === "darwin") {
        command = `osascript -e "set volume output muted ${muted}"`;
      } else if (process.platform === "win32") {
        command = `echo Mute control not implemented for Windows`;
      } else {
        command = `amixer set Master ${muted ? "mute" : "unmute"}`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Volume ${muted ? "muted" : "unmuted"}`);
        }
      });
    });
  }

  async takeScreenshot() {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `screenshot-${timestamp}.png`;
      const filepath = join(__dirname, "..", "screenshots", filename);

      let command;

      if (process.platform === "darwin") {
        command = `screencapture -x "${filepath}"`;
      } else if (process.platform === "win32") {
        command = `echo Screenshot not implemented for Windows`;
      } else {
        command = `gnome-screenshot -f "${filepath}"`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Screenshot saved: ${filepath}`);
        }
      });
    });
  }

  async sendNotification(message) {
    return new Promise((resolve, reject) => {
      let command;

      if (process.platform === "darwin") {
        command = `osascript -e 'display notification "${message}" with title "Gesture Recognition"'`;
      } else if (process.platform === "win32") {
        command = `msg * "${message}"`;
      } else {
        command = `notify-send "Gesture Recognition" "${message}"`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Notification sent: ${message}`);
        }
      });
    });
  }

  async executeCustomCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(`Command executed: ${command}\nOutput: ${stdout}`);
        }
      });
    });
  }

  async spotifyPlayPause() {
    try {
      let command;

      switch (process.platform) {
        case "darwin":
          command = `osascript -e 'tell application "Spotify" to playpause'`;
          break;
        case "win32":
          // Windows media key simulation
          command = `powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]179)"`;
          break;
        case "linux":
          command = `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.PlayPause`;
          break;
        default:
          throw new Error(
            `Spotify control not supported on ${process.platform}`
          );
      }

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve("Spotify play/pause toggled");
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to control Spotify: ${error.message}`);
    }
  }

  async spotifyNext() {
    try {
      let command;

      switch (process.platform) {
        case "darwin":
          command = `osascript -e 'tell application "Spotify" to next track'`;
          break;
        case "win32":
          // Windows media key simulation
          command = `powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]176)"`;
          break;
        case "linux":
          command = `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Next`;
          break;
        default:
          throw new Error(
            `Spotify control not supported on ${process.platform}`
          );
      }

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve("Spotify next track");
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to control Spotify: ${error.message}`);
    }
  }

  async spotifyPrevious() {
    try {
      let command;

      switch (process.platform) {
        case "darwin":
          command = `osascript -e 'tell application "Spotify" to previous track'`;
          break;
        case "win32":
          // Windows media key simulation
          command = `powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]177)"`;
          break;
        case "linux":
          command = `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Previous`;
          break;
        default:
          throw new Error(
            `Spotify control not supported on ${process.platform}`
          );
      }

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve("Spotify previous track");
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to control Spotify: ${error.message}`);
    }
  }

  async closeLastTab() {
    try {
      let command;

      switch (process.platform) {
        case "darwin":
          // Use Cmd+W to close the active tab
          command = `osascript -e 'tell application "System Events" to keystroke "w" using command down'`;
          break;
        case "win32":
          // Use Ctrl+W to close the active tab
          command = `powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^w')"`;
          break;
        case "linux":
          // Use Ctrl+W to close the active tab
          command = `xdotool key ctrl+w`;
          break;
        default:
          throw new Error(`Close tab not supported on ${process.platform}`);
      }

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve("Closed last tab");
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to close tab: ${error.message}`);
    }
  }

  async updateMapping(args) {
    const { gesture, action, actionParams } = args;

    this.gestureMappings.set(gesture, {
      action,
      params: actionParams || {},
      updatedAt: new Date().toISOString(),
    });

    await this.saveGestureMappings();

    return {
      content: [
        {
          type: "text",
          text: `Updated mapping: ${gesture} -> ${action}`,
        },
      ],
    };
  }

  async getGestures() {
    const gestures = Object.fromEntries(this.gestureMappings);
    const availableActions = this.getAvailableActions();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              currentMappings: gestures,
              availableActions,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async broadcastGesture(args) {
    const { gesture, timestamp, action, success = true, result, error } = args;

    const event = {
      id: uuidv4(),
      type: "gesture_detected",
      gesture,
      timestamp,
      action,
      success,
      result,
      error,
      serverTime: new Date().toISOString(),
    };

    // Broadcast to all connected WebSocket clients
    const message = JSON.stringify(event);
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`Broadcasted gesture event: ${gesture} -> ${action}`);

    return {
      content: [
        {
          type: "text",
          text: `Broadcasted gesture event to ${this.connectedClients.size} clients`,
        },
      ],
    };
  }

  getAvailableActions() {
    return [
      {
        name: "open_tab",
        description: "Open a new browser tab",
        params: { url: "string (optional, defaults to Google)" },
      },
      {
        name: "open_app",
        description: "Open a system application",
        params: { appName: "string (required)" },
      },
      {
        name: "facetime_call",
        description: "Make a FaceTime call to a specific phone number",
        params: { phoneNumber: "string (required)" },
      },
      {
        name: "volume_up",
        description: "Increase system volume",
        params: {},
      },
      {
        name: "volume_down",
        description: "Decrease system volume",
        params: {},
      },
      {
        name: "mute",
        description: "Mute system volume",
        params: {},
      },
      {
        name: "unmute",
        description: "Unmute system volume",
        params: {},
      },
      {
        name: "screenshot",
        description: "Take a screenshot",
        params: {},
      },
      {
        name: "notification",
        description: "Send a system notification",
        params: { message: "string (optional)" },
      },
      {
        name: "custom_command",
        description: "Execute a custom system command",
        params: { command: "string (required)" },
      },
      {
        name: "spotify_play_pause",
        description: "Play/pause Spotify music",
        params: {},
      },
      {
        name: "spotify_next",
        description: "Skip to next track in Spotify",
        params: {},
      },
      {
        name: "spotify_previous",
        description: "Go to previous track in Spotify",
        params: {},
      },
      {
        name: "close_tab",
        description: "Close the last opened browser tab",
        params: {},
      },
    ];
  }

  getRecentGestures() {
    // This would typically come from a database or in-memory store
    // For now, return a placeholder
    return {
      recent: [],
      total: this.gestureMappings.size,
    };
  }

  async loadGestureMappings() {
    try {
      await fs.ensureDir(dirname(this.configPath));

      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJson(this.configPath);
        this.gestureMappings = new Map(Object.entries(data));
        console.log("Loaded gesture mappings from config");
      } else {
        // Initialize with default mappings
        this.initializeDefaultMappings();
        await this.saveGestureMappings();
      }
    } catch (error) {
      console.error("Error loading gesture mappings:", error);
      this.initializeDefaultMappings();
    }
  }

  initializeDefaultMappings() {
    this.gestureMappings.set("wave", {
      action: "open_tab",
      params: { url: "https://www.netflix.com" },
      updatedAt: new Date().toISOString(),
    });

    this.gestureMappings.set("pinch", {
      action: "screenshot",
      params: {},
      updatedAt: new Date().toISOString(),
    });

    this.gestureMappings.set("fist", {
      action: "notification",
      params: { message: "Fist gesture detected!" },
      updatedAt: new Date().toISOString(),
    });

    this.gestureMappings.set("open_palm", {
      action: "open_app",
      params: { appName: "Calculator" },
      updatedAt: new Date().toISOString(),
    });

    this.gestureMappings.set("call_sign", {
      action: "open_app",
      params: { appName: "FaceTime" },
      updatedAt: new Date().toISOString(),
    });

    console.log("Initialized with default gesture mappings");
  }

  async saveGestureMappings() {
    try {
      await fs.ensureDir(dirname(this.configPath));
      await fs.writeJson(
        this.configPath,
        Object.fromEntries(this.gestureMappings),
        { spaces: 2 }
      );
      console.log("Saved gesture mappings to config");
    } catch (error) {
      console.error("Error saving gesture mappings:", error);
    }
  }

  setupWebSocketServer() {
    // WebSocket server will be created when HTTP server starts
    console.log("WebSocket server setup ready");
  }

  setupHttpServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Serve static files for the frontend
    app.use("/static", express.static(join(__dirname, "..", "public")));

    // API endpoints for frontend integration
    app.get("/api/gestures", (req, res) => {
      res.json(Object.fromEntries(this.gestureMappings));
    });

    app.post("/api/gestures", (req, res) => {
      const { gesture, action, params } = req.body;
      this.gestureMappings.set(gesture, { action, params: params || {} });
      this.saveGestureMappings();
      res.json({ success: true });
    });

    app.post("/api/detect-gesture", async (req, res) => {
      const { gesture, timestamp } = req.body;

      try {
        await this.performAction({ gesture, timestamp });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.httpServer = app.listen(3001, () => {
      console.log("HTTP server running on port 3001");

      // Create WebSocket server
      this.wsServer = new WebSocketServer({
        server: this.httpServer,
        path: "/ws",
      });

      this.wsServer.on("connection", (ws) => {
        console.log("New WebSocket client connected");
        this.connectedClients.add(ws);

        ws.on("close", () => {
          console.log("WebSocket client disconnected");
          this.connectedClients.delete(ws);
        });

        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          this.connectedClients.delete(ws);
        });
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Gesture Recognition MCP Server running on stdio");
  }
}

// Start the server
const server = new GestureRecognitionMCPServer();
server.run().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  if (server.wsServer) {
    server.wsServer.close();
  }
  if (server.httpServer) {
    server.httpServer.close();
  }
  process.exit(0);
});
