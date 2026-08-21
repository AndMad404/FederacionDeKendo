import { createContext } from "react";

export const PrerenderedAtContext = createContext<string | undefined>(
  undefined,
);
