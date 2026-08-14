import type { ReactNode } from "react";
import { COPY, LanguageContext, type Language } from "./i18n";

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider
      value={{
        language,
        locale: language === "es" ? "es-CR" : "en",
        copy: COPY[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
