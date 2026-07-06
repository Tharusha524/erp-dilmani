import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formsDir = path.join(__dirname, "../src/views/Reports/forms");

const HOOK_IMPORT = 'import { useReportGenerate } from "../../../../hooks/useReportGenerate";\n';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith("Form.tsx")) files.push(p);
  }
  return files;
}

for (const file of walk(formsDir)) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  if (
    content.includes('console.log("GENERATING REPORT WITH DATA:"') &&
    !content.includes("useReportGenerate")
  ) {
    const firstImport = content.match(/^import .+;\n/m);
    if (firstImport) {
      content = content.replace(firstImport[0], firstImport[0] + HOOK_IMPORT);
    }

    content = content.replace(
      /const handleGenerate = \(\) => \{\s*if \(!validate\(\)\) return;\s*console\.log\("GENERATING REPORT WITH DATA:", formData\);\s*\};/g,
      `const runReportPdf = useReportGenerate({ validate });\n  const handleGenerate = () => {\n    void runReportPdf(formData as Record<string, unknown>);\n  };`
    );

    content = content.replace(
      /const handleGenerate = \(\) => \{\s*if \(!validate\(\)\) return;\s*console\.log\("GENERATING REPORT WITH DATA:", formData\);\s*\};/g,
      `const runReportPdf = useReportGenerate({ validate });\n    const handleGenerate = () => {\n      void runReportPdf(formData as Record<string, unknown>);\n    };`
    );

    changed = true;
  }

  // Customer forms with dedicated API — switch to unified PDF
  if (
    content.includes("generateCustomerBalancesReport") ||
    content.includes("generateAgedCustomerAnalysisReport") ||
    content.includes("generateCustomerTrialBalanceReport") ||
    content.includes("generateCustomerDetailListingReport") ||
    content.includes("generateSalesSummaryReport")
  ) {
    if (!content.includes("useReportGenerate")) {
      content = content.replace(
        /import .+ReportsApi.*\n/,
        HOOK_IMPORT
      );
    }

    content = content.replace(
      /const handleGenerate = async \(\) => \{[\s\S]*?catch \(error[^}]*\}[^}]*\};/g,
      `const runReportPdf = useReportGenerate({ validate });\n  const handleGenerate = () => {\n    void runReportPdf(formData as Record<string, unknown>);\n  };`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("patched", path.relative(formsDir, file));
  }
}
