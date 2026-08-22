import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Force light mode as default initial state for now
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Ensure the system doesn't default to dark unless manually toggled
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Clean up any stray dark classes on mount to guarantee light mode initially
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      localStorage.setItem('theme', 'light');
      window.document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
