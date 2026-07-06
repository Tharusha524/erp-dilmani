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
let foundIssues = 0;

for (const filePath of allFiles) {
    if (filePath.endsWith('apiClient.ts') || filePath.endsWith('index.ts')) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Look for any remaining axios imports
    if (content.includes('import axios') && (content.includes('axios.get') || content.includes('axios.post'))) {
        console.log(`Issue found in: ${path.relative(apiDir, filePath)} - Uses raw axios`);
        foundIssues++;
    }
    
    // Look for any constant involving import.meta.env.VITE_API_BASE_URL
    if (content.includes('import.meta.env.VITE_API_BASE_URL')) {
        console.log(`Issue found in: ${path.relative(apiDir, filePath)} - Uses manual VITE_API_BASE_URL`);
        foundIssues++;
    }
}

console.log(`Total potential issues found: ${foundIssues}`);
