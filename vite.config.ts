import preact from "@preact/preset-vite"
import { resolve } from "path"
import { defineConfig } from "vite"
// import restart from "vite-plugin-restart"

import {
    check_asset_imports_plugin,
    copy_assets_files_plugin,
} from "./vite_handle_redirected_files"


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
    plugins: [
        preact(),
        // restart({ restart: [ "../public/**", ] }), // Restart server on file changes to public/
        copy_assets_files_plugin(asset_white_list),
        check_asset_imports_plugin(),
    ],
    resolve: {
        alias: {
            "core": resolve(__dirname, "./lib/core/src"),
        }
    },
})


function asset_white_list(path: string, entry: string): boolean
{
    // if (entry.endsWith("_boundary.geojson")) return true
    // if (path.match(/.*src\/assets\/scale_.*\.png/)) return true

    return false
}
