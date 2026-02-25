import React, { createContext, useContext } from 'react';
import { colors, type ModuleName } from '../tokens/colors';

interface ModuleTheme {
  module: ModuleName;
  accent: string;
}

const ModuleThemeContext = createContext<ModuleTheme>({
  module: 'books',
  accent: colors.modules.books,
});

export function useModuleTheme(): ModuleTheme {
  return useContext(ModuleThemeContext);
}

interface ModuleThemeProviderProps {
  module: ModuleName;
  children: React.ReactNode;
}

export function ModuleThemeProvider({ module, children }: ModuleThemeProviderProps) {
  const value: ModuleTheme = {
    module,
    accent: colors.modules[module],
  };

  return (
    <ModuleThemeContext.Provider value={value}>
      {children}
    </ModuleThemeContext.Provider>
  );
}
