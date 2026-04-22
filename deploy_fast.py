import paramiko
import os

HOST = "66.42.113.157"
USER = "root"
PASS = "@Ky8hTV{]NgqV@p)"
REMOTE_DIR = "/var/www/alshifa"

def main():
    print("Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected!")

    sftp = ssh.open_sftp()

    # Upload the tar.gz archive
    archive_path = "/home/z/my-project/deploy/alshifa-deploy.tar.gz"
    remote_archive = "/tmp/alshifa-deploy.tar.gz"
    print(f"Uploading archive ({os.path.getsize(archive_path) / 1024 / 1024:.1f}MB)...")
    
    # Use SFTP with larger buffer
    sftp.put(archive_path, remote_archive)
    print("Archive uploaded!")

    # Stop the process, backup, extract, and restart - all in one command
    print("Deploying on server...")
    cmds = f"""
cd {REMOTE_DIR}
pm2 stop alshifa 2>/dev/null
pm2 delete alshifa 2>/dev/null
# Backup old .next
mv .next .next.bak 2>/dev/null
# Extract new build
tar xzf /tmp/alshifa-deploy.tar.gz --strip-components=1
# Cleanup
rm -f /tmp/alshifa-deploy.tar.gz
rm -rf .next.bak
# Start
pm2 start server.js --name alshifa
pm2 save
echo "=== STATUS ==="
pm2 status alshifa
"""
    stdin, stdout, stderr = ssh.exec_command(cmds, timeout=120)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(f"STDERR: {err}")

    # Verify website is running
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
    status = stdout.read().decode().strip()
    print(f"Website status: HTTP {status}")

    # Verify the new code has Supabase fallbacks
    stdin, stdout, stderr = ssh.exec_command("grep -c 'ntshduvxdehefxmchusw' " + REMOTE_DIR + "/.next/static/chunks/*.js 2>/dev/null | grep -v ':0' | head -3")
    print(f"Supabase code found in: {stdout.read().decode().strip()}")

    sftp.close()
    ssh.close()
    print("Deployment complete!")

if __name__ == "__main__":
    main()
