import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	publicDir: "playground/public",
	resolve: {
		alias: {
			"~": path.resolve("playground"),
		},
	},
});
