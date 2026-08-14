/// <reference types="vite/client" />

import "react";

declare module "react" {
  interface ImgHTMLAttributes<_T> {
    // React 18 expects the lowercase DOM attribute at runtime.
    fetchpriority?: "high" | "low" | "auto";
  }
}
