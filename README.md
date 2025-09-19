# Gesture Recognition MCP Server

A Model Context Protocol (MCP) server that provides real-time gesture recognition capabilities with system action execution.

## Features

- **Real-time Gesture Recognition**: Detects gestures like wave, pinch, fist, and open palm
- **System Action Execution**: Executes actions like opening tabs, apps, adjusting volume, taking screenshots
- **WebSocket Communication**: Real-time event broadcasting to connected clients
- **RESTful API**: HTTP endpoints for frontend integration
- **Configurable Mappings**: Dynamic gesture-to-action mapping updates
- **Cross-platform Support**: Works on macOS, Windows, and Linux

## Architecture

This MCP server acts as the central hub for the gesture recognition system:

```
Gesture Detection Engine → MCP Server → Frontend UI
                           ↓
                    System Actions
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```

## MCP Resources

The server provides these resources:

- `gesture://mappings` - Current gesture-to-action mappings
- `gesture://available-actions` - List of available system actions
- `gesture://detected-gestures` - Recent gesture detection events

## MCP Tools

Available tools for interaction:

- `perform_action` - Execute system action based on detected gesture
- `update_mapping` - Update gesture-to-action mapping
- `get_gestures` - Get all available gestures and mappings
- `broadcast_gesture` - Broadcast gesture detection to connected clients

## HTTP API

The server runs on port 3001 and provides these endpoints:

- `GET /api/gestures` - Get current gesture mappings
- `POST /api/gestures` - Update gesture mappings
- `POST /api/detect-gesture` - Trigger gesture action
- `WS /ws` - WebSocket connection for real-time events

## Default Gesture Mappings

- **Wave** → Open Google tab
- **Pinch** → Take screenshot
- **Fist** → Send notification
- **Open Palm** → Open Calculator app

## System Actions

Supported system actions:

- `open_tab` - Open browser tab
- `open_app` - Launch system application
- `volume_up`/`volume_down` - Adjust system volume
- `mute`/`unmute` - Toggle mute
- `screenshot` - Take screenshot
- `notification` - Send system notification
- `custom_command` - Execute custom shell command

## Configuration

Gesture mappings are stored in `config/gesture-mappings.json` and automatically loaded on startup.

## Integration

### With Frontend (Person A)
The frontend can connect via:
- HTTP API for gesture mapping management
- WebSocket for real-time gesture events
- MCP client library for direct integration

### With Gesture Engine (Person B)
The gesture recognition engine can send events via:
- Direct MCP tool calls
- HTTP POST to `/api/detect-gesture`
- WebSocket messages

## Development

The server uses ES modules and includes:
- Express.js for HTTP server
- WebSocket for real-time communication
- MCP SDK for protocol compliance
- Cross-platform system command execution

## License

MIT