import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import { Palette, Check, ChevronDown } from 'lucide-react';

const ThemeSelector = () => {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeEntries = Object.entries(themes);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-white/80 hover:text-white transition-colors duration-200"
        title="Select theme"
      >
        <Palette className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">
          {themes[currentTheme].name}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme selector dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                Choose Theme
              </h3>
              <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">
                Select a theme to customize the appearance
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {themeEntries.map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      setIsOpen(false);
                    }}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      currentTheme === key
                        ? 'border-gray-900 dark:border-dark-100 bg-gray-50 dark:bg-dark-700'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500 bg-white dark:bg-dark-800'
                    }`}
                  >
                    {/* Theme preview */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ 
                          background: theme.gradient,
                          boxShadow: theme.shadow 
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-dark-100">
                          {theme.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-dark-400">
                          {theme.description}
                        </div>
                      </div>
                      {currentTheme === key && (
                        <Check className="w-5 h-5 text-gray-900 dark:text-dark-100" />
                      )}
                    </div>
                    
                    {/* Color palette preview */}
                    <div className="flex space-x-1">
                      <div 
                        className="w-6 h-3 rounded-sm"
                        style={{ backgroundColor: theme.primary }}
                        title="Primary"
                      />
                      <div 
                        className="w-6 h-3 rounded-sm"
                        style={{ backgroundColor: theme.secondary }}
                        title="Secondary"
                      />
                      <div 
                        className="w-6 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: theme.background }}
                        title="Background"
                      />
                      <div 
                        className="w-6 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: theme.surface }}
                        title="Surface"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer with theme info */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
              <div className="text-xs text-gray-500 dark:text-dark-400">
                Current: <span className="font-medium">{themes[currentTheme].name}</span>
                <br />
                Theme preferences are saved automatically
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
