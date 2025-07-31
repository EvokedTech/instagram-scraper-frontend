const fs = require('fs');
const path = require('path');

console.log('Checking frontend dependencies...\n');

const requiredDependencies = [
  '@heroicons/react',
  'axios',
  'next',
  'react',
  'react-dom',
  'socket.io-client',
  'swr',
  'typescript'
];

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const installedDeps = Object.keys(packageJson.dependencies || {});

let missingDeps = [];

requiredDependencies.forEach(dep => {
  if (!installedDeps.includes(dep)) {
    missingDeps.push(dep);
    console.log(`❌ Missing: ${dep}`);
  } else {
    console.log(`✅ Installed: ${dep}`);
  }
});

if (missingDeps.length > 0) {
  console.log('\n⚠️  Missing dependencies found!');
  console.log('Run the following command to install them:');
  console.log(`npm install ${missingDeps.join(' ')}`);
} else {
  console.log('\n✅ All required dependencies are installed!');
}

// Check for node_modules
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('\n⚠️  node_modules folder not found!');
  console.log('Run: npm install');
}