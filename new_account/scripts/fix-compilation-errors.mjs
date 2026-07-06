import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '../src/api');

function walk(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walk(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFiles = walk(apiDir);
let fixedCount = 0;

for (const filePath of allFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. If it uses 'axios' but doesn't import it, or we want to force 'api'
    // First, let's see if it has 'import api from "../apiClient"'
    const hasApiImport = content.includes('import api from');
    
    // Replace 'axios.' with 'api.' if it's not imported but 'api' is available or we're adding it
    if (content.includes('axios.')) {
        content = content.replace(/axios\./g, 'api.');
        if (!hasApiImport) {
            // Figure out relative path to apiClient
            const relPath = path.relative(path.dirname(filePath), apiDir);
            const importPath = path.join(relPath, 'apiClient').replace(/\\/g, '/');
            content = `import api from "${importPath.startsWith('.') ? importPath : './' + importPath}";\n` + content;
        }
    }

    // 2. Fix duplicate imports (like in userManagement.ts)
    const lines = content.split('\n');
    const uniqueLines = [];
    const seenImports = new Set();
    for (const line of lines) {
        if (line.trim().startsWith('import api from')) {
            if (seenImports.has(line.trim())) continue;
            seenImports.add(line.trim());
        }
        uniqueLines.push(line);
    }
    content = uniqueLines.join('\n');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedCount++;
    }
}

console.log(`Compilation Fix: Corrected ${fixedCount} files for axios name errors and duplicate imports.`);
