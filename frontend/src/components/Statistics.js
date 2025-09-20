import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

function Statistics({ recentGestures }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [stats, setStats] = useState({
    totalGestures: 0,
    successfulGestures: 0,
    failedGestures: 0,
    mostUsedGesture: null,
    averageResponseTime: 0,
    gesturesPerHour: 0
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
        gesturesPerHour: 0
      });
      return;
    }

    const filteredGestures = recentGestures.filter(gesture => {
      const gestureTime = new Date(gesture.timestamp);
      const now = new Date();
      const timeDiff = now - gestureTime;

      switch (timeRange) {
        case '1h':
          return timeDiff <= 60 * 60 * 1000;
        case '24h':
          return timeDiff <= 24 * 60 * 60 * 1000;
        case '7d':
          return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });

    const totalGestures = filteredGestures.length;
    const successfulGestures = filteredGestures.filter(g => g.success).length;
    const failedGestures = totalGestures - successfulGestures;

    // Find most used gesture
    const gestureCounts = {};
    filteredGestures.forEach(gesture => {
      gestureCounts[gesture.gesture] = (gestureCounts[gesture.gesture] || 0) + 1;
    });
    const mostUsedGesture = Object.keys(gestureCounts).reduce((a, b) => 
      gestureCounts[a] > gestureCounts[b] ? a : b, null
    );

    // Calculate gestures per hour
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
    const gesturesPerHour = totalGestures / hours;

    setStats({
      totalGestures,
      successfulGestures,
      failedGestures,
      mostUsedGesture,
      averageResponseTime: 0, // Would need response time data
      gesturesPerHour: Math.round(gesturesPerHour * 10) / 10
    });
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

  const getSuccessRate = () => {
    if (stats.totalGestures === 0) return 0;
    return Math.round((stats.successfulGestures / stats.totalGestures) * 100);
  };

  const getGestureFrequency = (gesture) => {
    if (!recentGestures) return 0;
    const filteredGestures = recentGestures.filter(g => {
      const gestureTime = new Date(g.timestamp);
      const now = new Date();
      const timeDiff = now - gestureTime;
      
      switch (timeRange) {
        case '1h':
          return timeDiff <= 60 * 60 * 1000;
        case '24h':
          return timeDiff <= 24 * 60 * 60 * 1000;
        case '7d':
          return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
    
    return filteredGestures.filter(g => g.gesture === gesture).length;
  };

  const getAllGestures = () => {
    if (!recentGestures) return [];
    const gestures = [...new Set(recentGestures.map(g => g.gesture))];
    return gestures.sort((a, b) => getGestureFrequency(b) - getGestureFrequency(a));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gesture Statistics</h1>
            <p className="text-gray-600 mt-1">Analyze gesture detection performance and usage patterns</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field w-auto"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="w-8 h-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Gestures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGestures}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{getSuccessRate()}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="w-8 h-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gestures/Hour</p>
              <p className="text-2xl font-bold text-gray-900">{stats.gesturesPerHour}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Most Used</p>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getGestureIcon(stats.mostUsedGesture)}</span>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {stats.mostUsedGesture ? stats.mostUsedGesture.replace('_', ' ') : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gesture Frequency Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gesture Frequency</h3>
          {getAllGestures().length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No gesture data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getAllGestures().slice(0, 8).map((gesture, index) => {
                const frequency = getGestureFrequency(gesture);
                const maxFrequency = Math.max(...getAllGestures().map(g => getGestureFrequency(g)));
                const percentage = maxFrequency > 0 ? (frequency / maxFrequency) * 100 : 0;
                
                return (
                  <div key={gesture} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 w-20">
                      <span className="text-lg">{getGestureIcon(gesture)}</span>
                      <span className="text-xs text-gray-600 capitalize truncate">
                        {gesture.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
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
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success/Failure Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-success-600" />
                <span className="font-medium text-success-900">Successful</span>
              </div>
              <span className="text-2xl font-bold text-success-700">{stats.successfulGestures}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-danger-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-danger-600" />
                <span className="font-medium text-danger-900">Failed</span>
              </div>
              <span className="text-2xl font-bold text-danger-700">{stats.failedGestures}</span>
            </div>

            {stats.failedGestures > 0 && (
              <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                  <span className="text-sm text-warning-700">
                    {getSuccessRate() < 80 ? 'Low success rate detected' : 'Some failures occurred'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Gesture History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Gesture History</h3>
        {recentGestures.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent gestures detected</p>
            <p className="text-sm text-gray-400">Start making gestures to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGestures.slice(0, 10).map((gesture, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getGestureIcon(gesture.gesture)}</span>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {gesture.gesture.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {gesture.action && `${gesture.action} • `}
                      {formatTime(gesture.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {gesture.success ? (
                    <CheckCircle className="w-5 h-5 text-success-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-danger-500" />
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
