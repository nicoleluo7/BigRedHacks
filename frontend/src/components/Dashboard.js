import React, { useState, useEffect } from "react";
import {
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import ApiService from "../services/ApiService";

function Dashboard({
  gestureMappings = {},
  recentGestures = [],
  onGestureDetected,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastGesture, setLastGesture] = useState(null);
  const [gestureCount, setGestureCount] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [pythonRunning, setPythonRunning] = useState(false);

  useEffect(() => {
    // Fake initial connection check
    ApiService.testConnection().then(setIsConnected);

    // Load system status if needed
    ApiService.getSystemStatus?.().then(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/python-status")
        .then((res) => res.json())
        .then((data) => setPythonRunning(data.status === "running"));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const togglePython = () => {
    fetch("/api/restart-python", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setPythonRunning(data.status === "started"));
  };

  const getGestureIcon = (gesture) => {
    const iconMap = {
      wave: "👋",
      fist: "✊",
      open_palm: "✋",
      thumbs_up: "👍",
      peace: "✌️",
      pointing: "👆",
      rock_sign: "🤘",
      ok_sign: "👌",
      call_sign: "🤙",
      middle_finger: "🖕",
      ring_finger: "💍",
      pinky: "🖐️",
      three_fingers: "🤟",
      four_fingers: "🖖",
    };
    return iconMap[gesture] || "🤚";
  };

  const getActionDescription = (action, params) => {
    switch (action) {
      case "open_tab":
        return `Open ${params.url || "Google"}`;
      case "open_app":
        return `Open ${params.appName}`;
      case "volume_up":
        return "Volume Up";
      case "volume_down":
        return "Volume Down";
      case "spotify_play_pause":
        return "Spotify Play/Pause";
      case "spotify_next":
        return "Spotify Next Track";
      case "notification":
        return `Notification: ${params.message || "Gesture detected!"}`;
      case "custom_command":
        return `Command: ${params.command}`;
      default:
        return action;
    }
  };

  const mappedGestures = Object.entries(gestureMappings).length;
  const totalGestures = 17;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gesture Recognition Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and control your gesture recognition system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected
                  ? "bg-success-100 text-success-700"
                  : "bg-danger-100 text-danger-700"
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {isConnected ? "Active" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Gestures Detected
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {gestureCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-success-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Mapped Gestures
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {mappedGestures}/{totalGestures}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Gesture</p>
              <p className="text-sm font-semibold text-gray-900">
                {lastGesture ? getGestureIcon(lastGesture.gesture) : "None"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-3">
          <button
            onClick={togglePython}
            className={`w-full text-left ${
              isRestarting
                ? "btn-secondary opacity-50 cursor-not-allowed"
                : "btn-primary"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isRestarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>
                  {pythonRunning ? "Stop Python Script" : "Run Python Script"}
                </span>
              </div>
              <span>→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Gesture Mappings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Gesture Mappings
        </h3>
        {Object.keys(gestureMappings).length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No gesture mappings configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gestureMappings).map(([gesture, mapping]) => (
              <div key={gesture} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getGestureIcon(gesture)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {gesture.replace("_", " ")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getActionDescription(
                        mapping.action,
                        mapping.params || {}
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
