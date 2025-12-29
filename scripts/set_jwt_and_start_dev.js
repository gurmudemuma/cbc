const fs = require('fs');
const { spawn } = require('child_process');

try {
  const secret = require('crypto').randomBytes(64).toString('base64');
  const envPath = 'C:/project/cbc/api/.env';

  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter(l => !/^JWT_SECRET=/.test(l))
      .join('\n') + '\n';
  }

  content += `JWT_SECRET=${secret}\n`;
  fs.writeFileSync(envPath, content, { encoding: 'utf8' });
  console.log('Wrote', envPath);

  // Use cmd /c to ensure Windows finds the npm command
  const dev = spawn('cmd', ['/c', 'npm run dev'], { stdio: 'inherit', cwd: 'C:/project/cbc/api/exporter-portal' });
  dev.on('exit', code => process.exit(code));
} catch (err) {
  console.error('Failed to set JWT and start dev:', err);
  process.exit(2);
}
