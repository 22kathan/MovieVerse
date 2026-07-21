const fs = require('fs');
const path = require('path');

const dynamicRoutes = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/lists/[id]/route.ts',
  'src/app/api/lists/[id]/items/route.ts',
  'src/app/api/reviews/[id]/route.ts',
  'src/app/api/users/[id]/route.ts'
];

for (const file of dynamicRoutes) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('generateStaticParams')) {
      const paramName = file.includes('[...nextauth]') ? 'nextauth' : 'id';
      const func = paramName === 'nextauth'
        ? '\nexport function generateStaticParams() { return [{ nextauth: ["session"] }]; }\n'
        : '\nexport function generateStaticParams() { return [{ id: "1" }]; }\n';
      content += func;
      fs.writeFileSync(file, content);
      console.log(`Added generateStaticParams to ${file}`);
    }
  }
}
