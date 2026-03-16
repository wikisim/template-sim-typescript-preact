/**
 * When a website, like this water map app, is built and uploaded as an interactable
 * to WikiSim, WikiSim maps all the file paths to the file_id in the supabase storage bucket. e.g.
 *
 *      Original file path in app: ./src/assets/data/england_boundary.geojson
 *      Original file path in build website app: ./dist/assets/data/england_boundary.geojson
 *      File path map stored in wikisim data_components table's result_value field as:
 *          `{ "/assets/data/england_boundary.geojson": "650e7e2e-6e1f-4c87-8912-10771253517d" }`
 *
 * When the interactable website is loaded on WikiSim these requests for files are
 * sent to wikisim-server.wikisim.deno.net which looks up the data component ID, e.g. 1219v4
 * and redirects the request to the supabase storage API e.g.
 *
 *      Requested URL in production: https://wikisim-server.wikisim.deno.net/1219v4/data/england_boundary.geojson
 *      Looks up file path in map: { "/assets/data/england_boundary.geojson": "650e7e2e-6e1f-4c87-8912-10771253517d" }
 *      Converts id "650e7e2e-6e1f-4c87-8912-10771253517d" to a storage URL and redirects to:
 *      https://sfkgqscbwofiphfxhnxg.supabase.co/storage/v1/object/public/interactables_files/edae071af63d3a637925f31a7a8186e41a7c657fc72b59f05cc3d001aa96dc73
 *
 * This would work fine except that the index.js file will also be redirected to
 * https://sfkgqscbwofiphfxhnxg.supabase.co/storage/v1/object/public/interactables_files/<some_number>
 * which results in the import.meta.url in the JS modules pointing to the wrong
 * origin of https://sfkgqscbwofiphfxhnxg.supabase.co/storage/v1/object/public/interactables_files/
 * instead of https://wikisim-server.wikisim.deno.net/1219v4/
 *
 * This plugin setup does two things to fix this:
 * 1. During development, it throws an error if any file in src/assets/ is statically
 *    imported, which would cause the wrong origin issue. This ensures developers
 *    use asset_url() from utils/asset_url.ts instead, which resolves URLs relative
 *    to document.baseURI (the hosting site URL).
 * 2. During production build, it copies all files from src/assets/ into dist/assets/,
 *    preserving directory structure so asset_url() paths resolve correctly in production.
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs"
import { dirname, join, relative, resolve, sep } from "path"
import { Plugin } from "vite"


export interface WhiteListFilesFunction
{
    /**
     * @param path - Absolute file path, e.g. /Users/user_name/sim_name/src/assets/data/england_boundary.geojson
     * @param entry - File name, e.g. england_boundary.geojson
     * @returns true if the file should be copied to dist/ and allowed to be imported
     *          with asset_url(), false if it should not be copied and imports should throw an error.
     */
    (path: string, entry: string): boolean
}


/**
 * Build plugin: copies whitelisted files from src/assets/ into dist/assets/assets/,
 * preserving directory structure so asset_url() paths resolve correctly in production.
 *
 * The extra nesting (assets/assets/) arises because the hosting site serves dist/ at
 * hostingsite.com/assets/, so document.baseURI is hostingsite.com/assets/index.html and
 * new URL("assets/foo.png", document.baseURI) resolves to hostingsite.com/assets/assets/foo.png.
 */
export function copy_assets_files_plugin(white_list?: WhiteListFilesFunction): Plugin
{
    return {
        name: "copy-assets-files",
        apply: "build",
        closeBundle()
        {
            const src_dir = resolve(__dirname, "src/assets")
            const dest_dir = resolve(__dirname, "dist/assets")
            mkdirSync(dest_dir, { recursive: true })
            copy_files(src_dir, src_dir, dest_dir, white_list)
        }
    }
}


/**
 * Recursively copy files from src_dir into dest_dir, preserving subdirectory structure.
 * src_root is used to compute relative paths (pass src_dir on the initial call).
 */
function copy_files(src_dir: string, src_root: string, dest_root: string, white_list: WhiteListFilesFunction | undefined): void
{
    for (const entry of readdirSync(src_dir))
    {
        const full_path = join(src_dir, entry)
        if (statSync(full_path).isDirectory())
        {
            copy_files(full_path, src_root, dest_root, white_list)
        }
        else if (white_list?.(full_path, entry) ?? true)
        {
            const dest_path = join(dest_root, relative(src_root, full_path))
            mkdirSync(dirname(dest_path), { recursive: true })
            copyFileSync(full_path, dest_path)
        }
    }
}


/**
 * Dev plugin: throws an error when any file in src/assets/ is statically imported.
 *
 * Static imports resolve via import.meta.url (the JS module's URL), which points to the
 * redirected server URL in production — not the hosting site URL. This causes all
 * asset requests to go to the wrong origin. Use asset_url() from utils/asset_url.ts instead.
 *
 * Also reports if the file would not be copied in production (fails the whitelist), so the
 * developer knows to add it rather than discovering the problem after deploying.
 */
export function check_asset_imports_plugin(options: { relative_path_to_src?: string, relative_path_to_assets?: string} = {}): Plugin
{
    const {
        relative_path_to_src = "src",
        relative_path_to_assets = "src/assets",
    } = options

    return {
        name: "check-asset-imports",
        apply: "serve",
        enforce: "pre",
        resolveId(source, importer)
        {
            if (!importer) return null

            const resolved_path = resolve(dirname(importer), source)
            const assets_dir = resolve(__dirname, relative_path_to_assets)

            if (!resolved_path.startsWith(assets_dir + sep)) return null

            // Path relative to src root, for use in the suggested asset_url() call
            const src_root = resolve(__dirname, relative_path_to_src)
            const relative_path = relative(src_root, resolved_path).replace(/\\/g, "/")

            // Get the relative path of the importer to the root, for clearer error messages
            const importer_path = relative(__dirname, resolve(__dirname, importer))


            throw new Error(
                `[check-asset-imports] Static import of "${source}" in "${importer_path}" will silently fail in production. ` +
                `Replace this import with: asset_url("${relative_path}"). ` +
                `See https://github.com/wikisim/wikisim-frontend/issues/39 for more info.`
            )
        }
    }
}
