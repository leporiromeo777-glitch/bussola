import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // L'app Expo ha la sua configurazione (cd mobile && npm run lint).
    "mobile/**",
    // Le lezioni video (Remotion) sono un progetto a parte: cd video && npm run typecheck.
    "video/**",
  ]),
]);

export default eslintConfig;
