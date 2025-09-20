import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  Wifi,
  WifiOff,
  AlertCircle,
  Monitor
} from 'lucide-react';
import WebSocketService from '../services/WebSocketService';

function CameraView() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraIndex, setCameraIndex] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [lastGesture, setLastGesture] = useState(null);
  const [fps, setFps] = useState(0);
  const [cameraFrame, setCameraFrame] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  useEffect(() => {
    // Set up WebSocket listener for camera frames
    const removeListener = WebSocketService.addEventListener((event, data) => {
      if (event === 'message' && data.type === 'camera_frame') {
        setCameraFrame(data);
        if (data.gesture) {
          setLastGesture({
            gesture: data.gesture,
            timestamp: data.timestamp
          });
        }
        frameCountRef.current++;
      }
    });

    return removeListener;
  }, []);

  const connectToCamera = async () => {
    try {
      setError(null);
      
      // Check if camera stream is available
      const response = await fetch('/api/camera-frame');
      if (response.ok) {
        setIsConnected(true);
        setIsStreaming(true);
        
        // Start FPS counter
        const fpsInterval = setInterval(() => {
          const now = Date.now();
          const elapsed = now - lastFpsTimeRef.current;
          if (elapsed >= 1000) {
            setFps(Math.round((frameCountRef.current * 1000) / elapsed));
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }
        }, 1000);

        return () => clearInterval(fpsInterval);
      } else {
        throw new Error('Camera stream not available');
      }
    } catch (err) {
      setError(`Failed to connect to camera: ${err.message}`);
      setIsConnected(false);
      setIsStreaming(false);
    }
  };

  const disconnectFromCamera = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setFps(0);
  };

  const toggleStreaming = () => {
    if (isStreaming) {
      disconnectFromCamera();
    } else {
      connectToCamera();
    }
  };

  const getGestureIcon = (gesture) => {
    const iconMap = {
      'wave': '👋',
      'fist': '✊',
      'open_palm': '✋',
      'thumbs_up': '👍',
      'peace': '✌️',
      'pointing': '👆',
      'rock_sign': '🤘',
      'ok_sign': '👌',
      'call_sign': '🤙',
      'middle_finger': '🖕',
      'ring_finger': '💍',
      'pinky': '🖐️',
      'three_fingers': '🤟',
      'four_fingers': '🖖',
    };
    return iconMap[gesture] || '🤚';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Camera Feed</h1>
            <p className="text-gray-600 mt-1">Live gesture recognition from your camera</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isConnected ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Toggle Stream Button */}
            <button
              onClick={toggleStreaming}
              className={`flex items-center space-x-2 ${
                isStreaming ? 'btn-danger' : 'btn-success'
              }`}
            >
              {isStreaming ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Stream</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Start Stream</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera Index
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={cameraIndex}
                onChange={(e) => setCameraIndex(parseInt(e.target.value))}
                className="input-field"
                placeholder="Camera device index"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usually 0 for default webcam, 1 for external camera
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-danger-500" />
            <p className="text-danger-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Camera Feed</h3>
              <div className="flex items-center space-x-4">
                {isConnected && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Monitor className="w-4 h-4" />
                    <span>{fps} FPS</span>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Display */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {!isConnected ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Camera Not Connected</p>
                    <p className="text-gray-500 text-sm">Start the Python backend first: python run.py</p>
                  </div>
                </div>
              ) : cameraFrame ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={`data:image/jpeg;base64,${cameraFrame.image}`}
                    alt="Camera Feed"
                    className="w-full h-full object-cover"
                  />
                  {cameraFrame.gesture && (
                    <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg">
                      <span className="text-lg mr-2">{getGestureIcon(cameraFrame.gesture)}</span>
                      <span className="font-medium capitalize">
                        {cameraFrame.gesture.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Camera className="w-20 h-20 mx-auto mb-4 opacity-50" />
                        <p className="text-xl font-semibold mb-2">Waiting for Camera Feed</p>
                        <p className="text-sm opacity-75">
                          Make sure Python backend is running
                        </p>
                        <div className="mt-4 flex justify-center space-x-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="btn-secondary flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isConnected 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-danger-100 text-danger-700'
                }`}>
                  {isConnected ? 'Streaming' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Last Gesture */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Detected Gesture</h3>
            {lastGesture ? (
              <div className="text-center">
                <div className="text-4xl mb-3">{getGestureIcon(lastGesture.gesture)}</div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {lastGesture.gesture.replace('_', ' ')}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formatTime(lastGesture.timestamp)}
                </p>
                {lastGesture.action && (
                  <p className="text-xs text-gray-500 mt-2">
                    Action: {lastGesture.action}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🤚</div>
                <p className="text-gray-500">No gestures detected yet</p>
                <p className="text-sm text-gray-400">Make a gesture to see it here</p>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Camera Index</span>
                <span className="text-sm font-medium">{cameraIndex}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {isConnected ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Frame Rate</span>
                <span className="text-sm font-medium">{fps} FPS</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 font-medium">1.</span>
                <span>Make sure your camera is connected and working</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 font-medium">2.</span>
                <span>Click "Start Stream" to begin gesture recognition</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 font-medium">3.</span>
                <span>Make hand gestures in front of the camera</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 font-medium">4.</span>
                <span>Watch for detected gestures in the sidebar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraView;
