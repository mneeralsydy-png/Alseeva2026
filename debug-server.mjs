import { Client } from 'ssh2';

const conn = new Client();
function run(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`[SSH] $ ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', err2 = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { err2 += d; process.stderr.write(d.toString()); });
      stream.on('close', code => code === 0 ? resolve(out) : reject(new Error(`Exit ${code}: ${err2 || out}`)));
    });
  });
}

conn.on('ready', async () => {
  try {
    await run('ls -la /var/www/alshifa/server.js 2>/dev/null || echo "NO server.js"');
    await run('ls -la /var/www/alshifa/.next/ 2>/dev/null | head -15');
    await run('cat /var/www/alshifa/.next/BUILD_ID 2>/dev/null || echo "NO BUILD_ID"');
    await run('ls -la /var/www/alshifa/.next/server/ 2>/dev/null | head -10');
    await run('ls -la /var/www/alshifa/.next/static/ 2>/dev/null | head -5');
    await run('ls /var/www/alshifa/node_modules/next 2>/dev/null | head -5 || echo "NO next module"');
    await run('head -5 /var/www/alshifa/server.js 2>/dev/null');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    conn.end();
  }
});
conn.on('error', err => { console.error('SSH Error:', err.message); process.exit(1); });
conn.connect({ host: '66.42.113.157', port: 22, username: 'root', password: '@Ky8hTV{]NgqV@p)', readyTimeout: 15000 });
