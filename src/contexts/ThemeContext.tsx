
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeConfig {
  primaryGradient: string;
  secondaryGradient: string;
  accentColor: string;
  logoUrl: string;
  brandName: string;
  welcomeMessage: string;
  quickActions: string[];
  badgeImages?: string[];
}

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => boolean;
}

const defaultTheme: ThemeConfig = {
  primaryGradient: 'from-gray-800 to-black',
  secondaryGradient: 'from-gray-600 to-gray-800',
  accentColor: 'gray-800',
  logoUrl: 'https://cgahzcwiqcblmkwblqaj.supabase.co/storage/v1/object/public/cellular-text-pdf/The%20Behruz%20theory.png',
  brandName: "The Behruz Theory",
  welcomeMessage: "Welcome to The Behruz Theory. How can we assist you today?",
  quickActions: ['Try-On', 'Track my order', 'Size guide', 'Contact support'],
  badgeImages: ['https://cgahzcwiqcblmkwblqaj.supabase.co/storage/v1/object/public/cellular-text-pdf/itee.jpg' , 'https://c8.alamy.com/comp/2C6M1E6/1890-c-usa-the-usa-german-born-industrial-blue-jeans-denim-creator-levi-strauss-lb-strau-1829-1902-businessman-of-levi-strauss-co-industria-industriale-ritratto-portrait-history-foto-storica-industriale-industry-industria-imprenditore-abbigliamento-fashion-moda-maschile-beard-barba-tie-bow-cravatta-papillon-collar-colletto-archivio-gbb-2C6M1E6.jpg']
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatbot-theme');
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    }
  }, []);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    localStorage.setItem('chatbot-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('chatbot-theme');
  };

  const exportTheme = () => {
    return JSON.stringify(theme, null, 2);
  };

  const importTheme = (themeJson: string) => {
    try {
      const importedTheme = JSON.parse(themeJson);
      setTheme({ ...defaultTheme, ...importedTheme });
      localStorage.setItem('chatbot-theme', JSON.stringify(importedTheme));
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, exportTheme, importTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
