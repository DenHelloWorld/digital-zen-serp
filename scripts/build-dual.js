#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

/**
 * XOR-obfuscate a string with a static salt.
 * Not true encryption — just makes the key non-obvious in the bundle.
 */
function xorObfuscate(str, salt) {
  return Array.from(str).map((ch, i) => ch.charCodeAt(0) ^ salt.charCodeAt(i % salt.length));
}

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return result;
}

try {
  console.log('🚀 Начинаем чистую сборку для Chromium...');

  const env = loadEnv();
  const apiKey = env['PAGESPEED_API_KEY'] || '';

  if (!apiKey) {
    console.warn(
      '⚠️  PAGESPEED_API_KEY не задан в .env — PageSpeed API будет работать без ключа (низкий rate limit)'
    );
  } else {
    console.log('🔑 PAGESPEED_API_KEY загружен');
  }

  // Write key to generated file — avoids shell quoting issues on Windows
  const generatedPath = path.join(
    __dirname,
    '..',
    'src',
    'background',
    'pagespeed-key.generated.ts'
  );
  fs.writeFileSync(generatedPath, `export const PAGESPEED_API_KEY = ${JSON.stringify(apiKey)};\n`);

  const distDir = path.join(__dirname, '..', 'dist');
  const targetDir = path.join(distDir, 'SERP');
  const angularTrash = path.join(distDir, 'digital-zen-serp');
  const esbuildTrash = path.join(distDir, 'browser');

  console.log('📦 ng build...');
  execSync('ng build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('📦 esbuild background.ts...');
  execSync(
    'esbuild src/background.ts --bundle --outfile=dist/browser/background.js --format=iife --target=es2020 --platform=browser --external:chrome',
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const angularFiles = path.join(angularTrash, 'browser');
  if (fs.existsSync(angularFiles)) copyDir(angularFiles, targetDir);

  const bgFile = path.join(distDir, 'browser', 'background.js');
  if (fs.existsSync(bgFile)) fs.copyFileSync(bgFile, path.join(targetDir, 'background.js'));

  console.log('🧹 Очистка временных папок...');
  if (fs.existsSync(angularTrash)) fs.rmSync(angularTrash, { recursive: true, force: true });
  if (fs.existsSync(esbuildTrash)) fs.rmSync(esbuildTrash, { recursive: true, force: true });

  const manifestPath = path.join(targetDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.background?.type) delete manifest.background.type;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Cleanup generated key file
  if (fs.existsSync(generatedPath)) fs.rmSync(generatedPath);

  console.log('✅ Сборка завершена →', targetDir);
} catch (error) {
  console.error('\n❌ Ошибка:', error.message);
  process.exit(1);
}
