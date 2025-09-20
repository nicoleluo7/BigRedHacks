# Gesture Recognition Frontend

A modern React frontend for the Gesture Recognition System that provides a web-based interface for monitoring, configuring, and analyzing gesture detection.

## Features

- **📊 Dashboard**: Real-time monitoring of gesture detection with statistics and system status
- **📹 Camera View**: Live camera feed display (placeholder for Python backend integration)
- **⚙️ Configuration**: Manage gesture-to-action mappings with an intuitive interface
- **📈 Statistics**: Analyze gesture detection performance and usage patterns
- **🔌 Real-time Updates**: WebSocket integration for live gesture detection events
- **📱 Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- The gesture recognition backend server running on port 3001

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Main dashboard with stats and overview
│   │   ├── CameraView.js         # Camera feed display
│   │   ├── GestureConfig.js      # Gesture mapping configuration
│   │   └── Statistics.js         # Analytics and performance metrics
│   ├── services/
│   │   ├── WebSocketService.js   # WebSocket connection management
│   │   └── ApiService.js         # HTTP API client
│   ├── App.js                    # Main application component
│   ├── index.js                  # Application entry point
│   └── index.css                 # Global styles with Tailwind
├── package.json
├── tailwind.config.js
└── README.md
```

## API Integration

The frontend communicates with the backend through:

- **HTTP API**: For gesture mapping management (`/api/gestures`, `/api/detect-gesture`)
- **WebSocket**: For real-time gesture detection events (`/ws`)

### Available Endpoints

- `GET /api/gestures` - Get current gesture mappings
- `POST /api/gestures` - Update gesture mapping
- `DELETE /api/gestures/:gesture` - Delete gesture mapping
- `POST /api/detect-gesture` - Send gesture detection
- `WS /ws` - WebSocket connection for real-time updates

## Configuration

### Gesture Mappings

Configure which actions are triggered by each gesture through the Configuration page:

1. **Add Mapping**: Select a gesture and assign an action
2. **Edit Mapping**: Modify existing gesture-to-action mappings
3. **Delete Mapping**: Remove unwanted mappings

### Available Actions

- `open_tab` - Open browser tab with URL
- `open_app` - Launch system application
- `volume_up`/`volume_down` - Adjust system volume
- `spotify_play_pause`/`spotify_next` - Control Spotify
- `notification` - Send system notification
- `custom_command` - Execute shell command

## Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in `App.js`
3. Add navigation route if needed

### Styling

The project uses Tailwind CSS for styling. Custom styles are defined in `src/index.css` with utility classes.

### WebSocket Events

Listen for these WebSocket events:
- `connected` - WebSocket connection established
- `disconnected` - WebSocket connection lost
- `message` - Gesture detection event received
- `error` - WebSocket error occurred

## Deployment

The frontend is configured to proxy API requests to `http://localhost:3001` during development. For production deployment:

1. Update the API base URL in `ApiService.js`
2. Build the application: `npm run build`
3. Serve the `build` folder with your preferred web server

## Integration with Python Backend

To integrate with the Python gesture recognition system:

1. Ensure the Node.js server is running on port 3001
2. Start the Python gesture recognition: `python run.py`
3. The frontend will automatically connect and display real-time data

## Troubleshooting

### Connection Issues

- Verify the backend server is running on port 3001
- Check browser console for WebSocket connection errors
- Ensure no firewall is blocking the connection

### Camera Issues

- The camera feed is currently a placeholder
- Integration with Python OpenCV backend is required
- Check camera permissions in your browser

## Contributing

1. Follow the existing code style and structure
2. Add appropriate error handling and loading states
3. Test on different screen sizes for responsiveness
4. Update documentation for new features

## License

Part of the BigRedHacks Gesture Recognition System project.
