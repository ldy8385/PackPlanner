import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // 테마 설정 로드
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await storage.loadTheme();
      if (savedTheme) {
        setThemeModeState(savedTheme);
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  // 실제 다크모드 여부 계산
  const isDarkMode = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // 테마 변경 및 저장
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storage.saveTheme(mode);
  };

  // 토글 (light <-> dark)
  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  if (!isLoaded) {
    return null; // 로딩 중에는 렌더링 하지 않음
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDarkMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};
