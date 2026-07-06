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
    if (filePath.endsWith('apiClient.ts') || filePath.endsWith('index.ts')) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix manual VITE_API_BASE_URL access
    // Look for: import.meta.env.VITE_API_BASE_URL + "/api/something"
    content = content.replace(/import\.meta\.env\.VITE_API_BASE_URL\s*\+\s*["']\/api\/([^"']+)["']/g, '"/api/$1"');
    content = content.replace(/import\.meta\.env\.VITE_API_BASE_URL\s*\+\s*["']([^"']+)["']/g, '"$1"');

    // Make sure axios calls are api calls
    content = content.replace(/axios\.(get|post|put|delete|patch)\(/g, 'api.$1(');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedCount++;
        console.log(`Deep fixed: ${path.relative(apiDir, filePath)}`);
    }
}

console.log(`Deep fix complete. Files corrected: ${fixedCount}`);
