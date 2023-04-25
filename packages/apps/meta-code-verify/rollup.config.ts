import cleanOnce from "./rollup_scripts/rollup-plugin-clean-once";
import eslintPlugin from "@rollup/plugin-eslint";
import typescript from "@rollup/plugin-typescript";
import prettierBuildStart from "./rollup_scripts/rollup-plugin-prettier-build-start";
import staticFiles from "./rollup_scripts/rollup-plugin-static-files";
import watch from "./rollup_scripts/rollup-plugin-watch-additional";

function eslint() {
    return eslintPlugin({ throwOnError: true });
}

function prettierSrc() {
    return prettierBuildStart("'src/**/*.{js,ts}'");
}

export default [
    {
        input: "src/js/detectKvstoreMeta.ts",
        output: [{
            file: "dist/chrome/contentKvstore.js",
            format: "iife",
        }, {
            file: "dist/edge/contentKvstore.js",
            format: "iife"
        }, {
            file: "dist/firefox/contentKvstore.js",
            format: "iife"
        }],
        plugins: [cleanOnce(), typescript(), prettierSrc(), eslint()]
    },

    {
        input: "src/js/background.ts",
        output: [{
            file: "dist/chrome/background.js",
            format: "iife"
        }, {
            file: "dist/edge/background.js",
            format: "iife"
        }, {
            file: "dist/firefox/background.js",
            format: "iife"
        }],
        plugins: [typescript(), prettierSrc(), eslint()]
    },
    {
        input: "src/js/popup.ts",
        output: [{
            file: "dist/chrome/popup.js",
            format: "iife",
            plugins: [staticFiles("config/v3/")]
        }, {
            file: "dist/edge/popup.js",
            format: "iife",
            plugins: [staticFiles("config/v3/")]
        }, {
            file: "dist/firefox/popup.js",
            format: "iife",
            plugins: [staticFiles("config/v2/")]
        }],
        plugins: [
            typescript(),
            prettierSrc(),
            eslint(),
            staticFiles(["images/", "src/css/", "src/html/"]),
            staticFiles("_locales/", { keepDir: true }),
            watch(["images/", "src/css/", "src/html/", "_locales/", "config/"])
        ]
    }
];
