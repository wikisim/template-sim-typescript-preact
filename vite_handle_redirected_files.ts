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
