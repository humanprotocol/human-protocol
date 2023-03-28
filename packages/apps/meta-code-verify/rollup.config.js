import cleanOnce from "./build/rollup-plugin-clean-once.mjs";
import eslintPlugin from "@rollup/plugin-eslint";
import typescript from "@rollup/plugin-typescript";
import prettierBuildStart from "./build/rollup-plugin-prettier-build-start.mjs";
import staticFiles from "./build/rollup-plugin-static-files.mjs";
import watch from "./build/rollup-plugin-watch-additional.mjs";

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
        input: "src/js/background.js",
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
        input: "src/js/popup.js",
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
