# BigRedHacks - Gesture Recognition System 🚀

A complete gesture recognition system with real-time camera streaming, modern web frontend, and system action execution. Built for BigRedHacks hackathon with full-stack integration.

## ✨ Features

- **🤚 Real-time Gesture Recognition**: Detects 8+ gestures including wave, fist, thumbs up, peace sign, and more using MediaPipe
- **📹 Live Camera Streaming**: Web-based camera feed with real-time gesture overlays
- **⚡ System Action Execution**: Executes actions like opening tabs, apps, adjusting volume, Spotify control
- **🌐 Modern Web Frontend**: React-based dashboard with Tailwind CSS and dark mode support
- **🔄 RESTful API**: HTTP endpoints for frontend integration with WebSocket real-time updates
- **⚙️ Configurable Mappings**: Dynamic gesture-to-action mapping updates via web interface
- **🔄 Service Management**: Frontend-controlled Python service restart functionality
- **🌍 Cross-platform Support**: Works on macOS, Windows, and Linux
- **📊 Analytics Dashboard**: Real-time statistics and performance monitoring

## Architecture

The system consists of three main components:

```
Python Backend (Gesture Recognition) → Node.js Server (API) → React Frontend (UI)
                    ↓                           ↓
            Camera Streaming              System Actions
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Webcam** for gesture recognition

### Installation

1. **Clone and setup the repository:**
   ```bash
   git clone <your-repo-url>
   cd BigRedHacks
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Install Frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the System

**Option 1: Manual Setup (Recommended for development)**

Start all services in separate terminals:

#### Terminal 1: Node.js Server (API & WebSocket)
```bash
node src/server.js
```
Server will start on `http://localhost:3001`

#### Terminal 2: React Frontend
```bash
cd frontend
npm start
```
Frontend will start on `http://localhost:3000`

#### Terminal 3: Python Backend (Gesture Recognition)
```bash
python run.py --camera-index 1 --web-stream
```

**Option 2: Frontend-Controlled (Recommended for demo)**

1. Start only the Node.js server and frontend:
   ```bash
   # Terminal 1
   node src/server.js
   
   # Terminal 2
   cd frontend && npm start
   ```

2. Use the "Restart Python Service" button in the frontend dashboard

**Option 3: Quick Start Script**
```bash
# Start frontend and backend services
./start-frontend.sh
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


## 🤚 Supported Gestures

| Gesture     | Description                    | Default Action           |
| ----------- | ------------------------------ | ------------------------ |
| `fist`      | Closed fist (all fingers down) | Send notification        |
| `open_palm` | Open hand (all fingers up)     | Open Calculator app      |
| `thumbs_up` | Thumb up gesture               | Open Google tab          |
| `peace`     | Victory/peace sign             | Take screenshot          |
| `call_sign` | Hang loose (thumb + pinky)     | Volume up                |
| `pointing`  | Index finger pointing          | Volume down              |
| `rock_sign` | Rock on (index + pinky)        | Spotify play/pause       |
| `ok_sign`   | Thumb and index close together | Spotify next track       |

## ⚡ System Actions

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
- `screenshot` - Take system screenshot

## ⚙️ Configuration

Gesture mappings are stored in `config/gesture-mappings.json` and automatically loaded on startup. You can modify these mappings through the web interface or by editing the JSON file directly.

## 🌐 Frontend Features

The React frontend includes:

- **📊 Dashboard**: Real-time system status and gesture detection monitoring
- **🎥 Camera View**: Live camera feed with gesture overlays
- **⚙️ Gesture Configuration**: Dynamic gesture-to-action mapping management
- **📈 Statistics**: Performance analytics and gesture recognition metrics
- **🌙 Dark Mode**: Toggle between light and dark themes
- **🔄 Service Management**: Start/stop Python backend from the web interface

## 🔗 Integration

### Frontend Integration
The React frontend connects via:
- HTTP API for gesture mapping management
- WebSocket for real-time updates and camera streaming
- MCP client library for direct integration

### Gesture Recognition Integration
The Python gesture recognition engine can send events via:
- HTTP POST to `/api/detect-gesture`
- WebSocket connection for real-time communication
- Direct MCP tool calls

## Troubleshooting

### Common Issues

**Frontend shows "Disconnected":**
- Ensure Node.js server is running on port 3001
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

## 🛠️ Development

### Tech Stack

- **🐍 Python Backend**: 
  - OpenCV for camera capture and image processing
  - MediaPipe for gesture recognition and hand tracking
  - FastAPI-style HTTP client for server communication
  
- **🟢 Node.js Server**: 
  - Express.js for HTTP API endpoints
  - WebSocket for real-time communication
  - MCP SDK for Model Context Protocol compliance
  
- **⚛️ React Frontend**: 
  - Modern React with hooks and context
  - Tailwind CSS for styling
  - Dark mode support with context management
  - Real-time WebSocket integration

### Project Structure

```
BigRedHacks/
├── 📁 frontend/              # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   └── services/         # API services
├── 📁 src/                   # Node.js server
├── 📁 config/                # Configuration files
├── 📄 run.py                 # Python main entry point
├── 📄 gesture_recognition.py # Core gesture detection
├── 📄 actions_client.py      # Server communication
├── 📄 camera_streamer.py     # Camera streaming
└── 📄 requirements.txt       # Python dependencies
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📸 Screenshots

Check the `screenshots/` directory for application screenshots showing:
- Dashboard interface
- Camera view with gesture overlays
- Gesture configuration panel
- Statistics and analytics

## 🏆 BigRedHacks Project

This project was built for BigRedHacks hackathon, demonstrating:
- Real-time computer vision with MediaPipe
- Full-stack web development with React and Node.js
- Cross-platform system integration
- Modern UI/UX design with dark mode support

## 📄 License

MIT License - feel free to use this project for educational and development purposes!