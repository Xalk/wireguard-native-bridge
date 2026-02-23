const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the local library folder
config.watchFolders = [workspaceRoot];

// Metro find the node_modules from both the app and the library
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force Metro to use the app's version of React Native (avoids conflicts)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;