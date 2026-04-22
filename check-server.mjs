import { Client } from 'ssh2';

const VPS = '66.42.113.157';
const USER = 'root';
const PASS = '@Ky8hTV{]NgqV@p)';
const SERVER_DIR = '/var/www/alshifa';

function run(conn, cmd) {
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

function put(conn, local, remote) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(local, remote, err2 => err2 ? reject(err2) : resolve());
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('✅ SSH connected!\n');
  try {
    // Check PM2 config and server setup
    console.log('=== Check PM2 config ===');
    await run(conn, 'pm2 show alshifa 2>&1 | head -30');
    await run(conn, `ls -la ${SERVER_DIR}/.next/ 2>/dev/null | head -10`);
    await run(conn, `ls -la ${SERVER_DIR}/public/alshifa-debug.apk 2>/dev/null`);
    await run(conn, `ls ${SERVER_DIR}/node_modules/ 2>/dev/null | head -5`);
    await run(conn, `npm ls next --prefix ${SERVER_DIR} 2>&1 | head -5`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    conn.end();
  }
});
conn.on('error', err => { console.error('SSH Error:', err.message); process.exit(1); });
conn.connect({ host: VPS, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
