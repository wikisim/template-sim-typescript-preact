import preact from "@preact/preset-vite"
import { resolve } from "path"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
    root: "src/",
    // publicDir: "../public/",
    base: "./",
    server:
    {
        // Allow access to local network
        host: true,
    },
    build:
    {
        outDir: "../dist", // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true // Add sourcemap
    },
    plugins: [preact()],
    resolve: {
        alias: {
            "core": resolve(__dirname, "./lib/core/src"),
        }
    },
})
