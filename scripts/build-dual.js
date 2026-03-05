#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Рекурсивное копирование
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

try {
  console.log('🚀 Начинаем чистую сборку для Chromium...');

  const distDir = path.join(__dirname, '..', 'dist');
  const targetDir = path.join(distDir, 'SERP');

  // Пути к мусору, который оставляет Angular и esbuild
  const angularTrash = path.join(distDir, 'digital-zen-serp');
  const esbuildTrash = path.join(distDir, 'browser');

  // 1. Билдим Angular
  console.log('📦 ng build...');
  execSync('ng build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // 2. Билдим background.js
  console.log('📦 esbuild background.ts...');
  execSync(
    'esbuild src/background.ts --bundle --outfile=dist/browser/background.js --format=iife --target=es2020 --platform=browser --external:chrome',
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );

  // 3. Подготовка чистой папки chromium
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  // 4. Переносим файлы из папки билда Angular в chromium
  const angularFiles = path.join(angularTrash, 'browser');
  if (fs.existsSync(angularFiles)) {
    copyDir(angularFiles, targetDir);
  }

  // 5. Переносим background.js в chromium
  const bgFile = path.join(distDir, 'browser', 'background.js');
  if (fs.existsSync(bgFile)) {
    fs.copyFileSync(bgFile, path.join(targetDir, 'background.js'));
  }

  // 6. УДАЛЯЕМ ВЕСЬ МУСОР (оставляем только chromium)
  console.log('🧹 Очистка временных папок...');
  if (fs.existsSync(angularTrash)) fs.rmSync(angularTrash, { recursive: true, force: true });
  if (fs.existsSync(esbuildTrash)) fs.rmSync(esbuildTrash, { recursive: true, force: true });

  // 7. Фикс манифеста (IIFE)
  const manifestPath = path.join(targetDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.background?.type) delete manifest.background.type;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
} catch (error) {
  console.error('\n❌ Ошибка:', error.message);
  process.exit(1);
}
