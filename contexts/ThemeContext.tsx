
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Background Colors
  background: string;
  backgroundAlt: string;
  card: string;
  
  // Brand Colors
  brandPrimary: string;
  gradientStart: string;
  gradientEnd: string;
  highlight: string;
  
  // Text Colors
  text: string;
  textSecondary: string;
  placeholder: string;
  
  // Border & Divider
  border: string;
  divider: string;
  
  // Status Bar
  statusBarStyle: 'light' | 'dark';
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  backgroundAlt: '#F7F7F7',
  card: '#FBFBFB',
  brandPrimary: '#A40028',
  gradientStart: '#A40028',
  gradientEnd: '#A40028',
  highlight: '#A40028',
  text: '#000000',
  textSecondary: '#505050',
  placeholder: '#A0A0A0',
  border: '#D4D4D4',
  divider: '#E5E5E5',
  statusBarStyle: 'dark',
};

const darkTheme: ThemeColors = {
  background: '#0A0A0A',
  backgroundAlt: '#161616',
  card: '#161616',
  brandPrimary: '#A40028',
  gradientStart: '#A40028',
  gradientEnd: '#A40028',
  highlight: '#A40028',
  text: '#FFFFFF',
  textSecondary: '#DADADA',
  placeholder: '#888888',
  border: '#2A2A2A',
  divider: '#2A2A2A',
  statusBarStyle: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@roastlive_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
