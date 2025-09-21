import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme definitions
export const themes = {
  light: {
    name: 'Light',
    description: 'Clean and bright',
    primary: '#30e8b0',
    secondary: '#07363b',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    gradient: 'linear-gradient(135deg, #07363b 0%, #0d9488 100%)',
    navGradient: 'linear-gradient(135deg, #07363b 0%, #0d9488 100%)',
    cardBg: '#ffffff',
    shadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
    // Light theme gradients (keep existing)
    accentGradient: 'linear-gradient(135deg, #30e8b0 0%, #6ad1fa 50%, #0d9488 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    headerGradient: 'linear-gradient(135deg, #07363b 0%, #0d9488 100%)',
  },
  dark: {
    name: 'Dark',
    description: 'Modern dark mode',
    primary: '#30e8b0',
    secondary: '#64748b',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    navGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    cardBg: '#1e293b',
    shadow: '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
    // Dark theme gradients (keep existing)
    accentGradient: 'linear-gradient(135deg, #30e8b0 0%, #6ad1fa 50%, #64748b 100%)',
    cardGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    headerGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  },
  cornell: {
    name: 'Cornell',
    description: 'Cornell University colors',
    primary: '#d32f2f',
    secondary: '#b71c1c',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0',
    gradient: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
    navGradient: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
    cardBg: '#ffffff',
    shadow: '0 4px 14px 0 rgba(211, 47, 47, 0.25)',
    // Cornell-specific gradients
    accentGradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 50%, #b71c1c 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    headerGradient: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue waves',
    primary: '#0284c7',
    secondary: '#0369a1',
    background: '#f0f9ff',
    surface: '#ffffff',
    text: '#0c4a6e',
    textSecondary: '#075985',
    border: '#bae6fd',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    navGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    cardBg: '#ffffff',
    shadow: '0 4px 14px 0 rgba(2, 132, 199, 0.25)',
    // Ocean-specific gradients
    accentGradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
    headerGradient: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
  },
  forest: {
    name: 'Forest',
    description: 'Natural greens',
    primary: '#059669',
    secondary: '#047857',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#064e3b',
    textSecondary: '#065f46',
    border: '#bbf7d0',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    navGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    cardBg: '#ffffff',
    shadow: '0 4px 14px 0 rgba(5, 150, 105, 0.25)',
    // Forest-specific gradients
    accentGradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
    headerGradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm orange glow',
    primary: '#ea580c',
    secondary: '#c2410c',
    background: '#fff7ed',
    surface: '#ffffff',
    text: '#9a3412',
    textSecondary: '#c2410c',
    border: '#fed7aa',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    navGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    cardBg: '#ffffff',
    shadow: '0 4px 14px 0 rgba(234, 88, 12, 0.25)',
    // Sunset-specific gradients
    accentGradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #c2410c 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
    headerGradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft purple hues',
    primary: '#9333ea',
    secondary: '#7c3aed',
    background: '#faf5ff',
    surface: '#ffffff',
    text: '#581c87',
    textSecondary: '#6b21a8',
    border: '#e9d5ff',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
    navGradient: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
    cardBg: '#ffffff',
    shadow: '0 4px 14px 0 rgba(147, 51, 234, 0.25)',
    // Lavender-specific gradients
    accentGradient: 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #7c3aed 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
    headerGradient: 'linear-gradient(135deg, #9333ea 0%, #581c87 100%)',
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep purple night',
    primary: '#6366f1',
    secondary: '#4f46e5',
    background: '#0f0f23',
    surface: '#1a1a2e',
    text: '#e2e8f0',
    textSecondary: '#cbd5e1',
    border: '#2d3748',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    navGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    cardBg: '#1a1a2e',
    shadow: '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
    // Midnight-specific gradients
    accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
    cardGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    headerGradient: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)',
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Check localStorage first, then default to light
    const saved = localStorage.getItem('theme');
    return saved && themes[saved] ? saved : 'light';
  });

  const currentThemeData = themes[currentTheme];

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', currentTheme);
    
    // Update CSS custom properties for theme
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentThemeData.primary);
    root.style.setProperty('--theme-secondary', currentThemeData.secondary);
    root.style.setProperty('--theme-background', currentThemeData.background);
    root.style.setProperty('--theme-surface', currentThemeData.surface);
    root.style.setProperty('--theme-text', currentThemeData.text);
    root.style.setProperty('--theme-text-secondary', currentThemeData.textSecondary);
    root.style.setProperty('--theme-border', currentThemeData.border);
    root.style.setProperty('--theme-gradient', currentThemeData.gradient);
    root.style.setProperty('--theme-nav-gradient', currentThemeData.navGradient);
    root.style.setProperty('--theme-card-bg', currentThemeData.cardBg);
    root.style.setProperty('--theme-shadow', currentThemeData.shadow);

    // Update the HTML class for theme
    document.documentElement.className = currentTheme;
  }, [currentTheme, currentThemeData]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark for backward compatibility
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      currentThemeData, 
      themes, 
      setTheme, 
      toggleTheme,
      isDarkMode: currentTheme === 'dark' // For backward compatibility
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
