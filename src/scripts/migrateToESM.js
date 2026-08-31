import fs from 'fs';
import path from 'path';

// Core directories to process
const DIRS = [
  'D:/hub property/backend/src/controllers',
  'D:/hub property/backend/src/routes',
];

const convertFileToESM = (filePath) => {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Convert destructured require for relative paths:
  // const { x, y } = require('./z'); -> import { x, y } from './z.js';
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\);?/g, (match, variables, importPath) => {
    const ext = importPath.endsWith('.js') || importPath.endsWith('.json') ? '' : '.js';
    return `import { ${variables.trim()} } from '${importPath}${ext}';`;
  });

  // 2. Convert destructured require for npm packages:
  // const { x } = require('y'); -> import { x } from 'y';
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*require\(\s*['"]([^.'"][^'"]*)['"]\s*\);?/g, 'import { $1 } from "$2";');

  // 3. Convert standard require for relative paths:
  // const x = require('./y'); -> import x from './y.js';
  content = content.replace(/const\s+(\w+)\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\);?/g, (match, variable, importPath) => {
    const ext = importPath.endsWith('.js') || importPath.endsWith('.json') ? '' : '.js';
    return `import ${variable} from '${importPath}${ext}';`;
  });

  // 4. Convert standard require for npm packages:
  // const x = require('y'); -> import x from 'y';
  content = content.replace(/const\s+(\w+)\s*=\s*require\(\s*['"]([^.'"][^'"]*)['"]\s*\);?/g, 'import $1 from "$2";');

  // 5. Convert exports.funcName = ... -> export const funcName = ...
  content = content.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');

  // 6. Convert module.exports = ... -> export default ...
  content = content.replace(/module\.exports\s*=\s*([^;]+);?/g, 'export default $1;');

  fs.writeFileSync(filePath, content, 'utf8');
};

const getFiles = (dir) => {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      files = files.concat(getFiles(filePath));
    } else if (filePath.endsWith('.js')) {
      files.push(filePath);
    }
  });
  return files;
};

// Process all directories
DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = getFiles(dir);
    files.forEach(convertFileToESM);
  } else {
    console.log(`Directory does not exist: ${dir}`);
  }
});

console.log('ESM Migration completed successfully!');
