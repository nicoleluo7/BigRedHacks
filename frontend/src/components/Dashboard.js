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
  const [isRestarting, setIsRestarting] = useState(false);
  const [pythonRunning, setPythonRunning] = useState(false);

  // Calculate derived state from recentGestures
  const lastGesture = recentGestures.length > 0 ? recentGestures[0] : null;
  const gestureCount = recentGestures.length;

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

  // Count only gestures that actually have actions mapped (not null/undefined)
  const mappedGestures = Object.entries(gestureMappings).filter(
    ([_, mapping]) => mapping && mapping.action
  ).length;
  const totalGestures = 17;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-formal dark:bg-gradient-dark-card rounded-lg shadow-subtle dark:shadow-dark border border-primary-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white dark:text-dark-100">
              Gesture Recognition Dashboard
            </h1>
            <p className="text-white/90 dark:text-dark-300 mt-1">
              Monitor and control your gesture recognition system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm ${
                isConnected
                  ? "bg-white/20 dark:bg-dark-700/50 text-white dark:text-dark-100"
                  : "bg-white/10 dark:bg-dark-700/30 text-white/70 dark:text-dark-400"
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
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-dark-400">
                System Status
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {isConnected ? "Active" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-dark-400">
                Gestures Detected
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {gestureCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <Eye className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-dark-400">
                Mapped Gestures
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {mappedGestures}/{totalGestures}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-mint-100 dark:bg-mint-900/30 rounded-lg">
              <Clock className="w-8 h-8 text-mint-600 dark:text-mint-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-dark-400">
                Last Gesture
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                {lastGesture ? getGestureIcon(lastGesture.gesture) : "None"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-3">
          <button
            onClick={togglePython}
            className={`w-full text-left p-4 rounded-lg transition-colors duration-200 ${
              isRestarting
                ? "bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400 cursor-not-allowed"
                : "bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 dark:bg-dark-600/50 rounded-lg">
                  {isRestarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </div>
                <span className="font-medium">
                  {pythonRunning ? "Stop Python Script" : "Run Python Script"}
                </span>
              </div>
              <span className="text-xl">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Gesture Mappings */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-subtle dark:shadow-dark border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-lg transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4">
          Active Gesture Mappings
        </h3>
        {Object.keys(gestureMappings).length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400 dark:text-dark-500" />
            </div>
            <p className="text-gray-500 dark:text-dark-400">
              No gesture mappings configured
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gestureMappings).map(
              ([gesture, mapping], index) => (
                <div
                  key={gesture}
                  className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-dark transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getGestureIcon(gesture)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-dark-100 capitalize">
                        {gesture.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-dark-400">
                        {getActionDescription(
                          mapping.action,
                          mapping.params || {}
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
