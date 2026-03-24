const fs = require('fs');
const file = 'sections/snapshot-system.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const idCardSectionStart = lines.findIndex(line => line.includes('ID CARD SECTION'));
if (idCardSectionStart !== -1) {
  // Start 1 line above 'ID CARD SECTION'
  const cutIndex = idCardSectionStart > 0 ? idCardSectionStart - 1 : idCardSectionStart;
  const keep = lines.slice(0, cutIndex).join('\n') + '\n';
  const extract = lines.slice(cutIndex).join('\n');
  
  fs.writeFileSync('sections/card-certificate.js', extract);
  fs.writeFileSync(file, keep);
  
  console.log('Split completed!');
  console.log('card-certificate.js size:', extract.length);
  console.log('snapshot-system.js new size:', keep.length);
} else {
  console.log('Could not find ID CARD SECTION');
}
