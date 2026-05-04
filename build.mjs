import { build } from "esbuild";

let shared = {
	entryPoints: ["src/index.js"],
	bundle: true,
	external: ["react", "react-dom"],
	jsx: "automatic",
	loader: { ".js": "jsx", ".jsx": "jsx" },
	minify: true,
	sourcemap: true,
};

await build({ ...shared, format: "esm", outfile: "dist/index.esm.js" });
await build({ ...shared, format: "cjs", outfile: "dist/index.cjs.js" });

await build({ ...shared, entryPoints: ["demo/index.jsx"],
	format: "iife", outfile: "demo/index.js", external: undefined });
