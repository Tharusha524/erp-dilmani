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
let changedCount = 0;

for (const filePath of allFiles) {
    if (filePath.endsWith('apiClient.ts') || filePath.endsWith('index.ts')) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove pattern: const API_URL = import.meta.env.VITE_API_BASE_URL + "/api/something";
    // Replace with: const API_URL = "/api/something";
    const pattern = /const\s+(API_URL|BASE_URL|WORK_ORDERS_URL)\s*=\s*import\.meta\.env\.VITE_API_BASE_URL\s*\+\s*["']([^"']+)["']/g;
    
    if (pattern.test(content)) {
        content = content.replace(pattern, 'const $1 = "$2"');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        changedCount++;
    }
}

console.log(`Total files fixed for URL prefix: ${changedCount}`);
