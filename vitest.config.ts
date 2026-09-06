import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

// Deliberately its own config rather than reusing vite.config.ts: that
// one wires up the TanStack Start + Nitro SSR plugins, which unit tests
// have no need to boot. Keeping this separate means `npm test` stays
// fast and only depends on path resolution (for `@/...` imports).
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});