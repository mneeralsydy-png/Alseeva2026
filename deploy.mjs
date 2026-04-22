import { Client } from 'ssh2'
import fs from 'fs'
import { execSync } from 'child_process'

const HOST = '66.42.113.157'
const USER = 'root'
const PASS = '@Ky8hTV{]NgqV@p)'
const REMOTE = '/var/www/alshifa'
const LOCAL = '/home/z/my-project'

// Create tar of project (exclude unnecessary files)
console.log('📦 Creating archive...')
execSync(`tar czf /tmp/alshifa-deploy.tar.gz \
  --exclude='.next/cache' \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='android/app/build' \
  --exclude='android/.gradle' \
  --exclude='*.apk' \
  -C ${LOCAL} .`, { stdio: 'inherit' })

const conn = new Client()
conn.on('ready', () => {
  console.log('✅ SSH connected')
  
  conn.sftp((err, sftp) => {
    if (err) throw err
    console.log('📤 Uploading files...')
    sftp.fastPut('/tmp/alshifa-deploy.tar.gz', '/tmp/alshifa-deploy.tar.gz', (err) => {
      if (err) throw err
      console.log('✅ Upload complete, deploying...')
      
      const cmds = `cd ${REMOTE} && rm -rf * .* 2>/dev/null; cd ${REMOTE} && tar xzf /tmp/alshifa-deploy.tar.gz && rm /tmp/alshifa-deploy.tar.gz && npm install --production 2>&1 | tail -3 && pm2 restart alshifa 2>&1 && echo "DEPLOY_DONE"`
      
      conn.exec(cmds, (err, stream) => {
        if (err) throw err
        let out = ''
        stream.on('data', (d) => { out += d; process.stdout.write(d) })
        stream.stderr.on('data', (d) => { process.stderr.write(d) })
        stream.on('close', () => {
          console.log(out.includes('DEPLOY_DONE') ? '\n✅ Deployment complete!' : '\n⚠️ Check output above')
          conn.end()
          process.exit(0)
        })
      })
    })
  })
}).on('error', (err) => {
  console.error('SSH Error:', err)
  process.exit(1)
}).connect({ host: HOST, username: USER, password: PASS, readyTimeout: 15000 })
