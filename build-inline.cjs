/**
 * Build inline.html - 将所有资源内联到单个HTML文件
 * 用于绕过代理层速率限制问题
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'public');
const assetsDir = path.join(distDir, 'assets');

// 读取index.html
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 读取CSS文件
const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
let cssContent = '';
for (const cssFile of cssFiles) {
  cssContent += fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
}

// 读取主JS文件
const mainJsFile = fs.readdirSync(assetsDir).find(f => f.startsWith('index-') && f.endsWith('.js'));
let mainJs = fs.readFileSync(path.join(assetsDir, mainJsFile), 'utf-8');

// 关键修复：将JS中的 </script> 转义，防止浏览器提前关闭script标签
mainJs = mainJs.replace(/<\/script>/gi, '<\\/script>');
mainJs = mainJs.replace(/<\/style>/gi, '<\\/style>');

// 同样转义CSS中可能的问题
cssContent = cssContent.replace(/<\/style>/gi, '<\\/style>');

// 替换CSS link为内联style
html = html.replace(/<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css">/g, 
  `<style>${cssContent}</style>`);

// 替换主JS script为内联script
html = html.replace(/<script type="module" crossorigin src="\/assets\/[^"]+\.js"><\/script>/,
  `<script type="module">${mainJs}</script>`);

// 移除analytics script
html = html.replace(/<script\s+defer\s+src="%VITE_ANALYTICS_ENDPOINT%\/umami"[^>]*><\/script>/g, '');

// 写入inline.html
const outputPath = path.join(__dirname, 'dist', 'public', 'inline.html');
fs.writeFileSync(outputPath, html);

const stats = fs.statSync(outputPath);
console.log(`✅ inline.html generated: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Location: ${outputPath}`);
console.log(`   CSS files inlined: ${cssFiles.length}`);
console.log(`   Main JS inlined: ${mainJsFile}`);
console.log(`   </script> occurrences escaped in JS`);
