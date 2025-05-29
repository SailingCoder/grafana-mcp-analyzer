#!/usr/bin/env node

// Minimal test to verify the package builds correctly
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running minimal version test...');

// Check if main entry point exists
const mainFile = path.join(__dirname, '..', 'dist', 'server', 'mcp-server.js');
if (!fs.existsSync(mainFile)) {
  console.error('❌ Main entry point not found:', mainFile);
  process.exit(1);
}

// Check if types file exists
const typesFile = path.join(__dirname, '..', 'dist', 'types', 'index.d.ts');
if (!fs.existsSync(typesFile)) {
  console.error('❌ Types file not found:', typesFile);
  process.exit(1);
}

// Check if package.json exists
const packageFile = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageFile)) {
  console.error('❌ Package.json not found:', packageFile);
  process.exit(1);
}

// Try to parse package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (!packageJson.name || !packageJson.version) {
    console.error('❌ Package.json missing required fields');
    process.exit(1);
  }
  console.log(`✅ Package ${packageJson.name}@${packageJson.version} appears valid`);
} catch (error) {
  console.error('❌ Failed to parse package.json:', error.message);
  process.exit(1);
}

console.log('✅ All minimal tests passed!'); 