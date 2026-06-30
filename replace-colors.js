const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'apps', 'frontend', 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(directory, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace rgba(255, 158, 66 with primary blue rgb(37, 99, 235
    content = content.replace(/rgba\(255,\s*158,\s*66/g, 'rgba(37, 99, 235');
    
    // Replace hex #ff9e42 with primary #2563EB
    content = content.replace(/#ff9e42/gi, '#2563EB');
    
    // Replace hex #ffb066 with light blue #DBEAFE
    content = content.replace(/#ffb066/gi, '#DBEAFE');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
