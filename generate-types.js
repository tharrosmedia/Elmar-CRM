// generate-types.js
const fs = require('fs');
const { execSync } = require('child_process');

const configFile = 'worker-configuration.d.ts';

// Remove existing file to avoid overwrite error
if (fs.existsSync(configFile)) {
  try {
    fs.unlinkSync(configFile);
    console.log(`Removed existing ${configFile}`);
  } catch (err) {
    console.error(`Failed to remove ${configFile}:`, err);
    process.exit(1);
  }
}

// Generate types
try {
  execSync(`npx wrangler types --env-interface Env > ${configFile}`);
  console.log(`Generated ${configFile} from wrangler.toml`);
} catch (err) {
  console.error('Failed to generate types:', err);
  process.exit(1);
}

// Add dynamic tenant DB binding
try {
  let content = fs.readFileSync(configFile, 'utf8');
  content = content.replace(
    'export interface Env {',
    'export interface Env {\n  [key: `TENANT_DB_${string}`]: D1Database; // Dynamic tenant-specific D1 databases'
  );
  fs.writeFileSync(configFile, content);
  console.log(`Added dynamic tenant DB binding to ${configFile}`);
} catch (err) {
  console.error(`Failed to update ${configFile}:`, err);
  process.exit(1);
}