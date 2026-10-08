#!/usr/bin/env node

// Check the version before importing the rest of the CLI so an unsupported Node.js version fails with a clear
// message rather than an obscure error from code relying on newer Node.js features. Static imports are hoisted
// and evaluated before this module's body, hence the dynamic import below.
// Keep in sync with "engines" in package.json.
const minimumNodeMajorVersion = 24;
const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

if (nodeMajorVersion < minimumNodeMajorVersion) {
  console.error(
    `💥 scaffold requires Node.js ${String(minimumNodeMajorVersion)} or later, but is running on Node.js ${process.version}.`,
  );
  process.exitCode = 1;
} else {
  await import('./main.js');
}
