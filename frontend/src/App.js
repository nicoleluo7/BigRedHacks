import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  Settings,
  BarChart3,
  Activity,
  Menu,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";

// Components
import Dashboard from "./components/Dashboard";
import GestureConfig from "./components/GestureConfig";
import Statistics from "./components/Statistics";

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: Activity },
    { name: "Configure", href: "/configure", icon: Settings },
    { name: "Statistics", href: "/statistics", icon: BarChart3 },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🤚 Gesture Control
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-primary-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center">
            <ConnectionStatus />
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      fetch("/api/health")
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <Wifi className="w-5 h-5 text-success-500" />
      ) : (
        <WifiOff className="w-5 h-5 text-danger-500" />
      )}
      <span
        className={`text-sm font-medium ${
          isConnected ? "text-success-700" : "text-danger-700"
        }`}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}

function App() {
  const [gestureMappings, setGestureMappings] = useState({});
  const [recentGestures, setRecentGestures] = useState([]);

  useEffect(() => {
    fetch("/api/gestures")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded gesture mappings:", data);
        setGestureMappings(data);
      });
  }, []);

  const handleGestureDetected = (gestureData) => {
    setRecentGestures((prev) => [gestureData, ...prev.slice(0, 9)]); // Keep last 10
  };

  const handleMappingUpdate = (updatedMappings) => {
    setGestureMappings(updatedMappings);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  gestureMappings={gestureMappings}
                  recentGestures={recentGestures}
                  onGestureDetected={handleGestureDetected}
                />
              }
            />
            <Route
              path="/configure"
              element={
                <GestureConfig
                  gestureMappings={gestureMappings}
                  onMappingUpdate={handleMappingUpdate}
                />
              }
            />
            <Route
              path="/statistics"
              element={<Statistics recentGestures={recentGestures} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
