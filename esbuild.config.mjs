import esbuild from "esbuild";
import process from "process";


const banner = "/* Bundled by esbuild */";

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["main.ts"],
    bundle: true,
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
    minify: prod,
});

if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
