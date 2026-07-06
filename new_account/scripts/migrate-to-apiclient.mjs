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

    // 1. Replace axios imports with api (apiClient)
    // Replace: import axios from "axios"; -> import api from "path/to/apiClient";
    if (content.includes('from "axios"') || content.includes("'from \"axios\"'")) {
        const relPath = path.relative(path.dirname(filePath), path.join(apiDir, 'apiClient')).replace(/\\/g, '/');
        const importSuffix = relPath.startsWith('.') ? relPath : './' + relPath;
        
        content = content.replace(/import axios from "axios";/g, `import api from "${importSuffix}";`);
        content = content.replace(/import axios, \{ AxiosRequestHeaders \} from "axios";/g, `import api from "${importSuffix}";`);
    }

    // 2. Replace axios usage: axios.get -> api.get etc.
    content = content.replace(/axios\.(get|post|put|delete|patch)\(/g, 'api.$1(');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        changedCount++;
        console.log(`Updated: ${path.relative(apiDir, filePath)}`);
    }
}

console.log(`Total files updated: ${changedCount}`);
