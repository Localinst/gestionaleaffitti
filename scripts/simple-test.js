const fs = require('fs');
const path = require('path');

// Create test directory if not exists
const testDir = path.join(__dirname, '../test-output');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a simple HTML file
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1>This is a test</h1>
  <p>This is a simple test page with visible content.</p>
</body>
</html>
`;

// Write the file
const outputPath = path.join(testDir, 'test.html');
fs.writeFileSync(outputPath, htmlContent);

console.log(`Created test file at ${outputPath}`); 