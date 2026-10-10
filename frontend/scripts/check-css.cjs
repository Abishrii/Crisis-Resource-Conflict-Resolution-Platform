const fs = require('fs');
const html = fs.readFileSync('public/archive/index.html', 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];

const stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let line = 14;
let col = 0;

for (let i = 0; i < css.length; i++) {
  const c = css[i];
  if (c === '\n') { line++; col = 0; } else { col++; }
  
  if (inComment) {
    if (c === '*' && css[i+1] === '/') { inComment = false; i++; col++; }
    continue;
  }
  if (inString) {
    if (c === '\\') { i++; col++; continue; }
    if (c === stringChar) { inString = false; }
    continue;
  }
  if (c === '/' && css[i+1] === '*') { inComment = true; i++; col++; continue; }
  if (c === '"' || c === "'") { inString = true; stringChar = c; continue; }
  
  if (c === '{') {
    // get previous 30 chars for context
    const preview = css.substring(Math.max(0, i - 40), i).trim().replace(/\s+/g, ' ');
    stack.push({ line, col, preview });
  } else if (c === '}') {
    if (stack.length === 0) {
      console.log('UNEXPECTED } at line', line, 'col', col);
    } else {
      stack.pop();
    }
  }
}

console.log('Unclosed blocks remaining:', stack.length);
stack.forEach((item, idx) => {
  console.log(`Unclosed #${idx+1}: line ${item.line}, col ${item.col}, near: "${item.preview}"`);
});
