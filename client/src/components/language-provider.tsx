import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations } from "@/lib/i18n";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "ar") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  }, [language]);

  const t = (key: string, fallback?: string, params?: Record<string, any>) => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    let result = typeof value === "string" ? value : fallback || key;
    
    // Replace parameters in the string
    if (params) {
      Object.entries(params).forEach(([param, paramValue]) => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(paramValue));
      });
    }
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
