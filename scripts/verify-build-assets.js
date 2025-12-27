#!/usr/bin/env node

/**
 * Build Asset Verification Script
 * 
 * This script verifies that all system images from public/ are included in the build folder.
 * Run this after building to ensure all assets are present for deployment.
 */

const fs = require('fs');
const path = require('path');

// Required system images that must be in the build
const REQUIRED_IMAGES = [
  'person_using_pos.png',
  'creating_an_account.png',
  'Tenzen_Logo.svg',
  'Tenzen Logo.png',
  'logo192.png',
  'logo512.png',
  'favicon.ico',
  'manifest.json',
  'robots.txt',
  'index.html'
];

// Optional images (nice to have but not critical)
const OPTIONAL_IMAGES = [
  'person using pos.png',  // Duplicate with spaces
  'creating an account.png'  // Duplicate with spaces
];

function verifyBuildAssets() {
  const buildPath = path.join(__dirname, '..', 'build');
  const publicPath = path.join(__dirname, '..', 'public');

  console.log('\n🔍 Verifying Build Assets...\n');
  console.log(`📁 Build directory: ${buildPath}`);
  console.log(`📁 Public directory: ${publicPath}\n`);

  // Check if build directory exists
  if (!fs.existsSync(buildPath)) {
    console.error('❌ Build directory does not exist!');
    console.error('   Run "npm run build" first.\n');
    process.exit(1);
  }

  // Check if public directory exists
  if (!fs.existsSync(publicPath)) {
    console.error('❌ Public directory does not exist!');
    console.error('   This should not happen. Check your project structure.\n');
    process.exit(1);
  }

  let allPresent = true;
  const missing = [];
  const present = [];

  // Check required images
  console.log('📋 Checking Required Assets:');
  console.log('─'.repeat(60));
  
  REQUIRED_IMAGES.forEach(image => {
    const buildImagePath = path.join(buildPath, image);
    const publicImagePath = path.join(publicPath, image);
    
    const existsInBuild = fs.existsSync(buildImagePath);
    const existsInPublic = fs.existsSync(publicImagePath);
    
    if (existsInBuild) {
      const stats = fs.statSync(buildImagePath);
      console.log(`✅ ${image.padEnd(30)} (${(stats.size / 1024).toFixed(2)} KB)`);
      present.push(image);
    } else {
      console.log(`❌ ${image.padEnd(30)} MISSING`);
      missing.push(image);
      allPresent = false;
      
      // Check if it exists in public
      if (existsInPublic) {
        console.log(`   ⚠️  File exists in public/ but not in build/`);
        console.log(`   💡 This might indicate a build issue.`);
      } else {
        console.log(`   ⚠️  File missing from both public/ and build/`);
      }
    }
  });

  console.log('\n📋 Checking Optional Assets:');
  console.log('─'.repeat(60));
  
  OPTIONAL_IMAGES.forEach(image => {
    const buildImagePath = path.join(buildPath, image);
    if (fs.existsSync(buildImagePath)) {
      const stats = fs.statSync(buildImagePath);
      console.log(`ℹ️  ${image.padEnd(30)} (${(stats.size / 1024).toFixed(2)} KB) - Optional`);
    } else {
      console.log(`⚠️  ${image.padEnd(30)} Not found (optional, can be ignored)`);
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Present: ${present.length}/${REQUIRED_IMAGES.length}`);
  console.log(`❌ Missing: ${missing.length}/${REQUIRED_IMAGES.length}`);
  
  if (missing.length > 0) {
    console.log('\n❌ Missing Files:');
    missing.forEach(file => {
      console.log(`   - ${file}`);
    });
  }

  // Check static folder
  const staticPath = path.join(buildPath, 'static');
  if (fs.existsSync(staticPath)) {
    const staticFiles = fs.readdirSync(staticPath);
    console.log(`\n📦 Static assets folder: ${staticFiles.length} items`);
  }

  // Final result
  console.log('\n' + '='.repeat(60));
  if (allPresent) {
    console.log('✅ All required assets are present in build folder!');
    console.log('✅ Ready for deployment!\n');
    process.exit(0);
  } else {
    console.log('❌ Some required assets are missing!');
    console.log('⚠️  Please check the build process and ensure all files are copied.\n');
    process.exit(1);
  }
}

// Run verification
verifyBuildAssets();

