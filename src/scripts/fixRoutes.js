import fs from 'fs';
import path from 'path';

const ROUTES_DIR = 'D:/hub property/backend/src/routes';

const fixRouteFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace: import xxxController from '../controllers/xxx.controller.js';
  // with: import * as xxxController from '../controllers/xxx.controller.js';
  content = content.replace(/import\s+(\w+Controller)\s+from\s+['"](\.\.\/controllers\/[^'"]+\.js)['"];?/g, 'import * as $1 from "$2";');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed route imports: ${filePath}`);
};

const files = fs.readdirSync(ROUTES_DIR).filter(file => file.endsWith('.js'));
files.forEach(file => {
  fixRouteFile(path.join(ROUTES_DIR, file));
});

console.log('Route import fixes completed!');
