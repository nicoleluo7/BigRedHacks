# Gesture Recognition System

A complete gesture recognition system with real-time camera streaming, web frontend, and system action execution.

## Features

- **Real-time Gesture Recognition**: Detects 17+ gestures including wave, fist, thumbs up, peace sign, and more
- **Live Camera Streaming**: Web-based camera feed with gesture overlays
- **System Action Execution**: Executes actions like opening tabs, apps, adjusting volume, Spotify control
- **WebSocket Communication**: Real-time event broadcasting to connected clients
- **RESTful API**: HTTP endpoints for frontend integration
- **Configurable Mappings**: Dynamic gesture-to-action mapping updates
- **Service Restart**: Frontend-controlled Python service restart functionality
- **Cross-platform Support**: Works on macOS, Windows, and Linux

## Architecture

The system consists of three main components:

```
Python Backend (Gesture Recognition) → Node.js Server (API/WebSocket) → React Frontend (UI)
                    ↓                           ↓
            Camera Streaming              System Actions
```

## Quick Start

### Prerequisites

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the System

**Start all services in separate terminals:**

#### Terminal 1: Node.js Server (API & WebSocket)
```bash
node src/server.js
```

#### Terminal 2: React Frontend
```bash
cd frontend
npm start
```

#### Terminal 3: Python Backend (Gesture Recognition)
```bash
python run.py --camera-index 1 --web-stream
```

**Or use the restart functionality:**
- Start only the Node.js server and frontend
- Use the "Restart Python Service" button in the frontend dashboard

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

The Node.js server runs on port 3001 and provides these endpoints:

- `GET /api/gestures` - Get current gesture mappings
- `POST /api/gestures` - Update gesture mappings
- `DELETE /api/gestures/:gesture` - Delete gesture mapping
- `POST /api/detect-gesture` - Trigger gesture action
- `GET /api/status` - Get system status
- `GET /api/actions` - Get available actions
- `POST /api/camera-frame` - Receive camera frames from Python backend
- `GET /api/camera-frame` - Get latest camera frame
- `POST /api/restart-python` - Restart Python service
- `WS /ws` - WebSocket connection for real-time events

## WebSocket Events

The WebSocket connection provides real-time events:

- `gesture_detected` - When a gesture is recognized
- `camera_frame` - Live camera feed updates
- `connected`/`disconnected` - Connection status changes

## Default Gesture Mappings

- **Wave** → Open Google tab
- **Pinch** → Take screenshot
- **Fist** → Send notification
- **Open Palm** → Open Calculator app

## System Actions

Supported system actions:

- `open_tab` - Open browser tab (defaults to Google)
- `open_app` - Launch system application (macOS/Windows/Linux)
- `volume_up`/`volume_down` - Adjust system volume
- `spotify_play_pause` - Control Spotify playback
- `spotify_next` - Skip to next track in Spotify
- `notification` - Send system notification
- `custom_command` - Execute custom shell command
- `facetime_call` - Initiate FaceTime call (macOS only)
- `middle_finger` - Emergency stop Python service

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

## Troubleshooting

### Common Issues

**Frontend shows "Disconnected":**
- Ensure Node.js server is running on port 3001
- Check WebSocket connection in browser dev tools
- Verify Python backend is running with `--web-stream` flag

**Camera shows "Not Connected":**
- Start Python backend with: `python run.py --camera-index 1 --web-stream`
- Check camera permissions
- Try different camera index (0, 1, 2, etc.)

**Python service stops unexpectedly:**
- Use the "Restart Python Service" button in the frontend
- Check Python dependencies: `pip install -r requirements.txt`
- Verify camera is not being used by another application

**Port conflicts:**
- Frontend runs on port 3000
- Node.js server runs on port 3001
- Kill conflicting processes: `pkill -f "react-scripts" && pkill -f "node.*server"`

### Manual Process Management

**Kill all processes:**
```bash
pkill -f "python.*run.py" && pkill -f "node.*server.js" && pkill -f "react-scripts"
```

**Check running processes:**
```bash
ps aux | grep -E "(python.*run|node.*server|react-scripts)" | grep -v grep
```

## Development

The system uses:
- **Python**: OpenCV for camera, MediaPipe for gesture recognition
- **Node.js**: Express.js for HTTP server, WebSocket for real-time communication
- **React**: Modern frontend with Tailwind CSS
- **MCP SDK**: Protocol compliance for tool integration

## License

MIT