# 🤚 Gesture Recognition Module - MVP

**Your Python gesture recognition system for BigRedHacks MVP**

## 🎯 Overview

This module handles real-time hand gesture recognition using MediaPipe and sends detected gestures to the action execution server. Built for MVP speed and reliability.

## 📁 Module Structure

```
BigRedHacks/
├── gesture_recognition.py    # Core gesture detection with MediaPipe
├── actions_client.py        # Communication with action server
├── run.py                   # Main entry point
├── requirements.txt         # Python dependencies
└── GESTURE_RECOGNITION_README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 2. Start Action Server (Teammate B's part)

```bash
# In the main project directory
npm install
npm start
# Server runs on http://localhost:3001
```

### 3. Run Gesture Recognition

```bash
# Basic usage
python run.py

# With options
python run.py --camera-index 0 --use-websocket --debug
```

## 🤚 Supported Gestures

| Gesture     | Description                    | Rule-Based Detection     |
| ----------- | ------------------------------ | ------------------------ |
| `fist`      | Closed fist (all fingers down) | 0 extended fingers       |
| `open_palm` | Open hand (all fingers up)     | 5 extended fingers       |
| `thumbs_up` | Thumb up gesture (strict)      | Only thumb extended up   |
| `peace`     | Victory/peace sign             | Index + middle only      |
| `call_sign` | Hang loose (thumb + pinky)     | Thumb + pinky only       |
| `pointing`  | Index finger pointing          | Only index finger        |
| `rock_sign` | Rock on (index + pinky)        | Index + pinky (no thumb) |
| `ok_sign`   | Thumb and index close together | Thumb-index proximity    |

## 🔗 Integration Points

### With UI Teammate (Person A)

**Your module provides:**

- Real-time gesture detection from webcam
- Visual feedback window with gesture overlays
- Status information (FPS, detection count)

**Integration options:**

1. **Standalone**: Run your module independently
2. **Embedded**: Import `GestureRecognizer` class into their frontend
3. **Shared Display**: Disable display (`--no-display`) and let UI handle visualization

```python
# Example: UI teammate can import your recognizer
from gesture_recognition import GestureRecognizer, CameraManager

# In their camera handling code
recognizer = GestureRecognizer()
camera = CameraManager()

# Process their camera frames
annotated_frame, gesture = recognizer.process_frame(frame)
```

### With Action Teammate (Person B)

**Communication Protocol:**

- **HTTP**: `POST http://localhost:3001/api/detect-gesture`
- **WebSocket**: `ws://localhost:3001/ws`
- **Message Format**: `{"gesture": "thumbs_up", "timestamp": "2025-09-19T19:26:00.000Z"}`

**Their server expects:**

```json
{
  "gesture": "fist|open_palm|thumbs_up|peace|pointing|ok_sign",
  "timestamp": "ISO_TIMESTAMP"
}
```

**Server provides these actions:**

- `open_tab` - Opens browser tab
- `open_app` - Launches application
- `volume_up/down` - Volume control
- `screenshot` - Takes screenshot
- `notification` - System notification
- `custom_command` - Execute shell command

## ⚙️ Configuration

### Command Line Options

```bash
python run.py [OPTIONS]

Options:
  --camera-index INT     Camera device index (default: 0)
  --use-websocket       Use WebSocket instead of HTTP
  --debug               Enable debug logging
  --no-display          Disable camera window (headless mode)
```

### Gesture Detection Parameters

In `gesture_recognition.py`:

```python
recognizer = GestureRecognizer(
    min_detection_confidence=0.7,  # Hand detection threshold
    min_tracking_confidence=0.5,   # Hand tracking threshold
    max_num_hands=1                # Maximum hands to detect
)
```

### Communication Settings

In `actions_client.py`:

```python
client = ActionsClient(
    server_url="http://localhost:3001",
    websocket_url="ws://localhost:3001/ws",
    use_websocket=False,            # HTTP vs WebSocket
    timeout=5.0                     # Request timeout
)
```

## 🧪 Testing

### Test Gesture Recognition Only

```bash
python gesture_recognition.py
# Shows camera feed with gesture detection, no actions
```

### Test Actions Client Only

```bash
python actions_client.py
# Tests connection and sends sample gestures
```

### Test Full Integration

```bash
# Make sure action server is running first!
npm start

# Then run gesture recognition
python run.py --debug
```

## 📊 Performance

**Target Performance:**

- **FPS**: 15-30 fps on laptop webcam
- **Latency**: <100ms from gesture to action
- **Accuracy**: >90% for clear gestures
- **Resource Usage**: <50% CPU on modern laptop

**Optimization Tips:**

- Use `--no-display` for headless mode (saves ~10% CPU)
- Reduce camera resolution in `CameraManager` if needed
- Adjust `gesture_cooldown` in `GestureRecognizer` to prevent spam

## 🔧 Troubleshooting

### Common Issues

**1. "Failed to start camera"**

```bash
# Check available cameras
python -c "import cv2; print([i for i in range(5) if cv2.VideoCapture(i).isOpened()])"

# Try different camera index
python run.py --camera-index 1
```

**2. "Cannot connect to action server"**

```bash
# Make sure server is running
curl http://localhost:3001/api/gestures

# Check if port is in use
lsof -i :3001
```

**3. "Poor gesture recognition"**

- Ensure good lighting
- Keep hand clearly visible
- Maintain consistent distance from camera
- Adjust detection confidence if needed

**4. "High CPU usage"**

- Use `--no-display` flag
- Reduce camera resolution
- Close other applications

### Debug Mode

```bash
python run.py --debug
# Shows detailed logs including:
# - Frame processing times
# - Gesture detection details
# - Communication attempts
# - Error stack traces
```

## 🚧 Future Extensions

**Easy to add later:**

1. **More Gestures**: Add rules in `classify_gesture()`
2. **ML Classifier**: Replace rules with trained model
3. **Gesture Sequences**: Detect gesture combinations
4. **Multiple Hands**: Increase `max_num_hands` parameter
5. **Custom Actions**: Extend action server mappings

**Extension Points:**

```python
# Add new gesture in gesture_recognition.py
def classify_gesture(self, landmarks):
    # ... existing code ...

    # NEW: Rock and roll gesture
    elif extended_count == 2 and fingers_up[1] and fingers_up[4]:  # Index + pinky
        return "rock_and_roll"

# Add mapping in actions_client.py
GESTURE_MAPPINGS = {
    # ... existing mappings ...
    "rock_and_roll": "rock_and_roll"
}
```

## 📈 MVP Success Metrics

**Demo Ready Checklist:**

- [ ] Camera starts successfully
- [ ] Gestures detected in real-time
- [ ] Actions execute correctly
- [ ] No crashes during 5-minute demo
- [ ] Visual feedback works
- [ ] At least 3 gestures working reliably

**Performance Targets:**

- [ ] <2 second startup time
- [ ] > 15 FPS processing
- [ ] <500ms gesture-to-action latency
- [ ] > 80% gesture recognition accuracy

## 🤝 Team Coordination

### With UI Teammate (Person A)

**What they need from you:**

- Camera frame processing function
- Gesture detection results
- Visual annotation capability

**What you need from them:**

- Camera feed access (if integrating)
- UI layout requirements
- Display preferences

### With Action Teammate (Person B)

**What they need from you:**

- Consistent gesture names
- Reliable message delivery
- Error handling

**What you need from them:**

- Server running on localhost:3001
- Gesture-to-action mappings
- Action execution feedback

### Demo Coordination

1. **Setup Order**: Action server → Gesture recognition → UI
2. **Test Sequence**: Individual modules → Integration → Full demo
3. **Backup Plan**: Have HTTP fallback if WebSocket fails
4. **Demo Gestures**: Focus on 3 most reliable gestures

---

## 🎉 You're Ready!

Your gesture recognition module is complete and ready for integration. The modular design makes it easy to:

- Run standalone for testing
- Integrate with teammates' components
- Extend with more features later
- Debug issues independently

**Good luck with your hackathon demo! 🚀**
