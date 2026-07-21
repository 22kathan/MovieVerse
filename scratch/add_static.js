const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f === 'route.ts') {
      const c = fs.readFileSync(p, 'utf8');
      if (!c.includes('export const dynamic')) {
        fs.writeFileSync(p, 'export const dynamic = "force-static";\n' + c);
      }
    }
  }
}

walk('src/app/api');
console.log("Updated API routes for static export!");
