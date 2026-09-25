const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const localBin = path.join(os.homedir(), '.local/bin/cloudflared');
const bin = fs.existsSync(localBin) ? localBin : 'cloudflared';

console.log('🔄 Ensuring port 8081 is free...');
try {
  execSync('fuser -k 8081/tcp 2>/dev/null || true');
} catch (e) {}

console.log('🚀 Starting Cloudflare Tunnel on port 8081...');

const cloudflared = spawn(bin, ['tunnel', '--url', 'http://localhost:8081']);

let expoProcess = null;
let tunnelUrl = null;

function cleanup() {
  if (cloudflared && !cloudflared.killed) {
    cloudflared.kill('SIGTERM');
  }
  if (expoProcess && !expoProcess.killed) {
    expoProcess.kill('SIGTERM');
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

function handleData(data) {
  const text = data.toString();
  if (!tunnelUrl) {
    const match = text.match(urlRegex);
    if (match) {
      tunnelUrl = match[0];
      const parsed = new URL(tunnelUrl);
      console.log(`\n============================================================`);
      console.log(`🌐 Public Tunnel URL: ${tunnelUrl}`);
      console.log(`📱 Expo Go URL:      exp://${parsed.hostname}`);
      console.log(`============================================================\n`);
      startExpo(tunnelUrl, parsed.hostname);
    }
  }
}

cloudflared.stdout.on('data', handleData);
cloudflared.stderr.on('data', handleData);

cloudflared.on('close', (code) => {
  if (code !== 0 && !tunnelUrl) {
    console.error(`❌ cloudflared exited with code ${code}`);
    process.exit(code || 1);
  }
});

function startExpo(url, hostname) {
  console.log('📦 Starting Expo with public Cloudflare tunnel proxy...\n');
  const env = {
    ...process.env,
    EXPO_PACKAGER_PROXY_URL: url,
    REACT_NATIVE_PACKAGER_HOSTNAME: hostname,
  };

  expoProcess = spawn('npx', ['expo', 'start', '--localhost'], {
    env,
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });

  expoProcess.on('close', (code) => {
    cleanup();
  });
}
