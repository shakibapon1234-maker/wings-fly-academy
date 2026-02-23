const fs = require('fs');
const path = 'index.html';
let content = fs.readFileSync(path, 'utf8');

// Use exact strings seen in view_file output
content = content.replace(/â˜ ï¸  Cloud Sync/g, '☁️ Cloud Sync');
content = content.replace(/âš ï¸ /g, '⚠️');
content = content.replace(/âœ ï¸ /g, '✏️');
content = content.replace(/âš™ï¸ /g, '⚙️');

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement');
