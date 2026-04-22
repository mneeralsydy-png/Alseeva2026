import { Client } from 'ssh2';

const conn = new Client();
function run(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', code => code === 0 ? resolve(out) : reject(new Error(`Exit ${code}: ${out}`)));
    });
  });
}
conn.on('ready', async () => {
  try {
    console.log('Admin login:');
    console.log(await run(`curl -s -X POST https://abualzahracom.online/api/auth/login -H 'Content-Type: application/json' -d '{"username":"Am2026","password":"A777A777"}'`));
    console.log('\nViewer login:');
    console.log(await run(`curl -s -X POST https://abualzahracom.online/api/auth/login -H 'Content-Type: application/json' -d '{"username":"Hi","password":"Hi123"}'`));
    console.log('\nBad login:');
    console.log(await run(`curl -s -X POST https://abualzahracom.online/api/auth/login -H 'Content-Type: application/json' -d '{"username":"bad","password":"bad"}'`));
    console.log('\nWebsite:');
    console.log(await run(`curl -s -o /dev/null -w "HTTP %{http_code}" https://abualzahracom.online/`));
    console.log('\nAPK:');
    console.log(await run(`curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download}" https://abualzahracom.online/alshifa-debug.apk`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally { conn.end(); }
});
conn.on('error', err => { console.error('SSH Error:', err.message); process.exit(1); });
conn.connect({ host: '66.42.113.157', port: 22, username: 'root', password: '@Ky8hTV{]NgqV@p)', readyTimeout: 15000 });
