import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

function Statistics({ recentGestures }) {
  const { currentThemeData } = useTheme();
  const [timeRange, setTimeRange] = useState("24h");
  const [stats, setStats] = useState({
    totalGestures: 0,
    successfulGestures: 0,
    failedGestures: 0,
    mostUsedGesture: null,
    averageResponseTime: 0,
    gesturesPerHour: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [recentGestures, timeRange]);

  const calculateStats = () => {
    if (!recentGestures || recentGestures.length === 0) {
      setStats({
        totalGestures: 0,
        successfulGestures: 0,
        failedGestures: 0,
        mostUsedGesture: null,
        averageResponseTime: 0,
        gesturesPerHour: 0,
      });
      return;
    }

    const filteredGestures = recentGestures.filter((gesture) => {
      const gestureTime = new Date(gesture.timestamp);
      const now = new Date();
      const timeDiff = now - gestureTime;

      switch (timeRange) {
        case "1h":
          return timeDiff <= 60 * 60 * 1000;
        case "24h":
          return timeDiff <= 24 * 60 * 60 * 1000;
        case "7d":
          return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });

    const totalGestures = filteredGestures.length;
    const successfulGestures = filteredGestures.filter((g) => g.success).length;
    const failedGestures = totalGestures - successfulGestures;

    // Find most used gesture
    const gestureCounts = {};
    filteredGestures.forEach((gesture) => {
      gestureCounts[gesture.gesture] =
        (gestureCounts[gesture.gesture] || 0) + 1;
    });
    const mostUsedGesture = Object.keys(gestureCounts).reduce(
      (a, b) => (gestureCounts[a] > gestureCounts[b] ? a : b),
      null
    );

    // Calculate gestures per hour
    const hours =
      timeRange === "1h"
        ? 1
        : timeRange === "24h"
        ? 24
        : timeRange === "7d"
        ? 168
        : 1;
    const gesturesPerHour = totalGestures / hours;

    setStats({
      totalGestures,
      successfulGestures,
      failedGestures,
      mostUsedGesture,
      averageResponseTime: 0, // Would need response time data
      gesturesPerHour: Math.round(gesturesPerHour * 10) / 10,
    });
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

  const getSuccessRate = () => {
    if (stats.totalGestures === 0) return 0;
    return Math.round((stats.successfulGestures / stats.totalGestures) * 100);
  };

  const getGestureFrequency = (gesture) => {
    if (!recentGestures) return 0;
    const filteredGestures = recentGestures.filter((g) => {
      const gestureTime = new Date(g.timestamp);
      const now = new Date();
      const timeDiff = now - gestureTime;

      switch (timeRange) {
        case "1h":
          return timeDiff <= 60 * 60 * 1000;
        case "24h":
          return timeDiff <= 24 * 60 * 60 * 1000;
        case "7d":
          return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });

    return filteredGestures.filter((g) => g.gesture === gesture).length;
  };

  const getAllGestures = () => {
    if (!recentGestures) return [];
    const gestures = [...new Set(recentGestures.map((g) => g.gesture))];
    return gestures.sort(
      (a, b) => getGestureFrequency(b) - getGestureFrequency(a)
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // Less than 1 minute
      return "Just now";
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-purple rounded-xl shadow-purple border border-purple-200 p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-mint rounded-full opacity-30 animate-float"></div>
        <div
          className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-sky rounded-full opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              View Your Statistics
            </h1>
            <p className="text-white/90 mt-1">
              Analyze gesture detection performance and usage patterns
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <Calendar className="w-5 h-5 text-white" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-white border-none outline-none"
            >
              <option value="1h" className="text-gray-900">
                Last Hour
              </option>
              <option value="24h" className="text-gray-900">
                Last 24 Hours
              </option>
              <option value="7d" className="text-gray-900">
                Last 7 Days
              </option>
              <option value="all" className="text-gray-900">
                All Time
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="rounded-xl p-6 transition-all duration-300 animate-slide-up"
          style={{
            background: currentThemeData.accentGradient,
            boxShadow: currentThemeData.shadow,
            borderColor: currentThemeData.border,
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">
                Total Gestures
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalGestures}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 transition-all duration-300 animate-slide-up"
          style={{
            background: currentThemeData.gradient,
            boxShadow: currentThemeData.shadow,
            borderColor: currentThemeData.border,
            borderWidth: "1px",
            borderStyle: "solid",
            animationDelay: "0.1s",
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Success Rate</p>
              <p className="text-2xl font-bold text-white">
                {getSuccessRate()}%
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 transition-all duration-300 animate-slide-up"
          style={{
            background: currentThemeData.headerGradient,
            boxShadow: currentThemeData.shadow,
            borderColor: currentThemeData.border,
            borderWidth: "1px",
            borderStyle: "solid",
            animationDelay: "0.2s",
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Gestures/Hour</p>
              <p className="text-2xl font-bold text-white">
                {stats.gesturesPerHour}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 transition-all duration-300 animate-slide-up"
          style={{
            background: currentThemeData.cardGradient,
            boxShadow: currentThemeData.shadow,
            borderColor: currentThemeData.border,
            borderWidth: "1px",
            borderStyle: "solid",
            animationDelay: "0.3s",
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Most Used</p>
              <div className="flex items-center space-x-2">
                <span className="text-lg animate-bounce-slow">
                  {getGestureIcon(stats.mostUsedGesture)}
                </span>
                <p className="text-sm font-medium text-white capitalize">
                  {stats.mostUsedGesture
                    ? stats.mostUsedGesture.replace("_", " ")
                    : "None"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gesture Frequency Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-gradient-mint rounded-full mr-3 animate-pulse"></div>
            Gesture Frequency
          </h3>
          {getAllGestures().length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-mint rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500">No gesture data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getAllGestures()
                .slice(0, 8)
                .map((gesture, index) => {
                  const frequency = getGestureFrequency(gesture);
                  const maxFrequency = Math.max(
                    ...getAllGestures().map((g) => getGestureFrequency(g))
                  );
                  const percentage =
                    maxFrequency > 0 ? (frequency / maxFrequency) * 100 : 0;

                  return (
                    <div
                      key={gesture}
                      className="flex items-center space-x-3 animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-2 w-20">
                        <span className="text-lg animate-bounce-slow">
                          {getGestureIcon(gesture)}
                        </span>
                        <span className="text-xs text-gray-600 capitalize truncate">
                          {gesture.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-mint h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {frequency}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Success/Failure Breakdown */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-gradient-teal rounded-full mr-3 animate-pulse"></div>
            Success/Failure Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-mint rounded-lg animate-slide-up">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white">Successful</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {stats.successfulGestures}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-lg animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white">Failed</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {stats.failedGestures}
              </span>
            </div>

            {stats.failedGestures > 0 && (
              <div
                className="mt-4 p-3 bg-gradient-to-r from-yellow-400 to-orange-500 border border-yellow-300 rounded-lg animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">
                    {getSuccessRate() < 80
                      ? "Low success rate detected"
                      : "Some failures occurred"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Gesture History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-sky rounded-full mr-3 animate-pulse"></div>
          Recent Gesture History
        </h3>
        {recentGestures.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-sky rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500">No recent gestures detected</p>
            <p className="text-sm text-gray-400">
              Start making gestures to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGestures.slice(0, 10).map((gesture, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl animate-bounce-slow">
                    {getGestureIcon(gesture.gesture)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {gesture.gesture.replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {gesture.action && `${gesture.action} • `}
                      {formatTime(gesture.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {gesture.success ? (
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-1 bg-red-100 rounded-full">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistics;
