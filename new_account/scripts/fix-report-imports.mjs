import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formsDir = path.join(__dirname, "../src/views/Reports/forms");
const HOOK = 'import { useReportGenerate } from "../../../../hooks/useReportGenerate";\n';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith("Form.tsx")) files.push(p);
  }
  return files;
}

for (const file of walk(formsDir)) {
  let c = fs.readFileSync(file, "utf8");

  if (c.includes("useReportGenerate") && !c.includes("hooks/useReportGenerate")) {
    const idx = c.indexOf("export default");
    const before = c.lastIndexOf("\n", c.lastIndexOf("import ", idx));
    c = c.slice(0, before + 1) + HOOK + c.slice(before + 1);
    fs.writeFileSync(file, c);
    console.log("import", file);
  }

  if (c.includes('console.log("GENERATING REPORT WITH DATA:"')) {
    if (!c.includes("useReportGenerate")) {
      const idx = c.indexOf("export default");
      const before = c.lastIndexOf("\n", c.lastIndexOf("import ", idx));
      c = c.slice(0, before + 1) + HOOK + c.slice(before + 1);
    }
    c = c.replace(
      /const handleGenerate = \(\) => \{\s*console\.log\("GENERATING REPORT WITH DATA:", formData\);\s*\};/g,
      `const runReportPdf = useReportGenerate();\n  const handleGenerate = () => {\n    void runReportPdf(formData as Record<string, unknown>);\n  };`
    );
    c = c.replace(
      /const handleGenerate = \(\) => \{\s*if \(!validate\(\)\) return;\s*console\.log\("GENERATING REPORT WITH DATA:", formData\);\s*\};/g,
      `const runReportPdf = useReportGenerate({ validate });\n  const handleGenerate = () => {\n    void runReportPdf(formData as Record<string, unknown>);\n  };`
    );
    fs.writeFileSync(file, c);
    console.log("patch", file);
  }
}
