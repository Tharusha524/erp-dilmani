import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distIndex = join("dist", "index.html");
const dist404 = join("dist", "404.html");

if (!existsSync(distIndex)) {
  console.error("postbuild-spa-404: dist/index.html not found");
  process.exit(1);
}

copyFileSync(distIndex, dist404);
console.log("postbuild-spa-404: dist/404.html updated from index.html");
