const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/views', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('#f5f5f5')) {
      // Replace only within sx={{ ... backgroundColor: "#f5f5f5" ... }}
      // Or just replace all "#f5f5f5" with "action.hover" for backgroundColor
      let newContent = content.replace(/backgroundColor:\s*["']#f5f5f5["']/g, 'backgroundColor: "action.hover"');
      // Also catch anything like { backgroundColor: "#f5f5f5", ... }
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log('Updated', filePath);
      }
    }
  }
});
