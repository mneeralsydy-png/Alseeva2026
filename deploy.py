import paramiko
import tarfile
import io
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('66.42.113.157', username='root', password='@Ky8hTV{]NgqV@p)')
sftp = ssh.open_sftp()

# 1. Create server tarball
print("Creating server tarball...")
server_tar = io.BytesIO()
with tarfile.open(fileobj=server_tar, mode='w:gz') as tar:
    for root, dirs, files in os.walk('/home/z/my-project/.next/standalone'):
        for f in files:
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, '/home/z/my-project/.next/standalone')
            tar.add(full_path, arcname=arcname)
    for root, dirs, files in os.walk('/home/z/my-project/.next/static'):
        for f in files:
            full_path = os.path.join(root, f)
            arcname = os.path.join('.next/static', os.path.relpath(full_path, '/home/z/my-project/.next/static'))
            tar.add(full_path, arcname=arcname)

server_tar.seek(0)
print(f"Tarball size: {server_tar.getbuffer().nbytes / 1024 / 1024:.1f}MB")
sftp.putfo(server_tar, '/tmp/alshifa-server.tar.gz')
print("Server tarball uploaded")

# 2. Upload APK
print("Uploading APK...")
sftp.put('/home/z/my-project/android/app/build/outputs/apk/debug/app-debug.apk', '/var/www/alshifa/public/alshifa-debug.apk')
print("APK uploaded")

# 3. Extract and restart
commands = [
    'cd /var/www/alshifa && tar xzf /tmp/alshifa-server.tar.gz --overwrite',
    'pm2 restart alshifa',
    'sleep 3',
    'pm2 status alshifa',
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000',
    'curl -s -o /dev/null -w "%{http_code}" https://abualzahracom.online',
    'curl -sI https://abualzahracom.online/alshifa-debug.apk | head -1',
]

for cmd in commands:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(f"CMD: {cmd}")
    out = stdout.read().decode().strip()
    if out: print(f"OUT: {out}")
    err = stderr.read().decode().strip()
    if err: print(f"ERR: {err}")

sftp.close()
ssh.close()
print("\nDeployment complete!")
