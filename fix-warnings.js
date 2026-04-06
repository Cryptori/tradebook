const fs   = require('fs');
const path = require('path');

// Fix 1: index.html — add CSP
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('Content-Security-Policy')) {
  html = html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob: https: ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; worker-src 'self' blob:;">`
  );
  fs.writeFileSync('index.html', html);
  console.log('✓ index.html');
} else {
  console.log('- index.html already has CSP');
}

// Fix 2: All JSX — autoComplete + label→div
function fixFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;

  // Add autoComplete="off" to inputs without id/name/autoComplete
  c = c.replace(/<input\s/g, (match, offset) => {
    const chunk = c.slice(offset, offset + 200);
    if (chunk.includes('autoComplete') || chunk.includes('id=') || chunk.includes('name=') || chunk.includes('type="hidden"')) {
      return match;
    }
    return '<input autoComplete="off" ';
  });

  // Replace <label> → <div className="field-label">
  c = c.replace(/<label(\s+style=\{[^}]+\})?>/g, (m, s) => `<div className="field-label"${s || ''}>`);
  c = c.replace(/<\/label>/g, '</div>');

  if (c !== orig) {
    fs.writeFileSync(filePath, c);
    return true;
  }
  return false;
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(f)) walkDir(full);
    } else if (f.endsWith('.jsx')) {
      if (fixFile(full)) console.log('✓ ' + full.replace(process.cwd() + path.sep, ''));
    }
  });
}
walkDir('src');

// Fix 3: App.css — add .field-label
let css = fs.readFileSync('src/App.css', 'utf8');
if (!css.includes('.field-label')) {
  css = css.replace('label {', 'label, .field-label {');
  fs.writeFileSync('src/App.css', css);
  console.log('✓ App.css');
} else {
  console.log('- App.css already has .field-label');
}

console.log('\nDone! Restart dev server (Ctrl+C then npm run dev)');