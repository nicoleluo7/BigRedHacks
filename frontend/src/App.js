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
  Moon,
  Sun,
} from "lucide-react";

// Components
import Dashboard from "./components/Dashboard";
import GestureConfig from "./components/GestureConfig";
import Statistics from "./components/Statistics";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import ThemeSelector from "./components/ThemeSelector";

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentTheme, currentThemeData, toggleTheme } = useTheme();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Activity },
    { name: "Configure", href: "/configure", icon: Settings },
    { name: "Statistics", href: "/statistics", icon: BarChart3 },
  ];

  return (
    <nav 
      className="shadow-subtle border-b transition-all duration-300"
      style={{
        background: currentThemeData.navGradient,
        borderColor: currentThemeData.border,
        boxShadow: currentThemeData.shadow
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 
                className="text-xl font-semibold text-white"
                style={{ color: currentTheme === 'cornell' ? '#ffffff' : currentThemeData.text }}
              >
                Gesture Control System
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
                    className="inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      borderBottom: isActive ? '2px solid #ffffff' : 'none'
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Theme Selector & Connection Status */}
          <div className="flex items-center space-x-4">
            <ThemeSelector />
            <button
              onClick={toggleTheme}
              className="p-2 text-white/80 hover:text-white transition-colors duration-200"
              title="Toggle between light and dark mode"
            >
              {currentTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <ConnectionStatus />
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-white/80 hover:text-white transition-colors duration-200"
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
        <div 
          className="sm:hidden backdrop-blur-md border-t border-white/20"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block pl-3 pr-4 py-3 text-base font-medium transition-colors duration-200"
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                  }}
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
    <div 
      className="flex items-center space-x-2 backdrop-blur-sm rounded-lg px-3 py-2"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      {isConnected ? (
        <Wifi className="w-5 h-5 text-white" />
      ) : (
        <WifiOff className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
      )}
      <span
        className="text-sm font-medium"
        style={{ 
          color: isConnected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)' 
        }}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}

function App() {
  const [gestureMappings, setGestureMappings] = useState({});
  const [recentGestures, setRecentGestures] = useState([]);
  const { currentThemeData } = useTheme();

  useEffect(() => {
    fetch("/api/gestures")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded gesture mappings:", data);
        setGestureMappings(data);
      });

    // Poll for recent gestures every 2 seconds
    const interval = setInterval(() => {
      fetch("/api/recent-gestures")
        .then((res) => res.json())
        .then((data) => {
          setRecentGestures(data);
        })
        .catch((err) => console.error("Failed to fetch recent gestures:", err));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleGestureDetected = (gestureData) => {
    setRecentGestures((prev) => [gestureData, ...prev.slice(0, 9)]); // Keep last 10
  };

  const handleMappingUpdate = (updatedMappings) => {
    setGestureMappings(updatedMappings);
  };

  return (
    <Router>
      <div 
        className="min-h-screen transition-all duration-300"
        style={{ backgroundColor: currentThemeData.background }}
      >
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

function AppWithProvider() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithProvider;
