import paramiko
import time

HOST = "66.42.113.157"
USER = "root"
PASS = "@Ky8hTV{]NgqV@p)"
REMOTE_DIR = "/var/www/alshifa"

def run_cmd(ssh, cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

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
    print(f"Uploading archive...")
    sftp.put(archive_path, remote_archive)
    print("Archive uploaded!")

    # Stop and clean
    print("Stopping old process...")
    run_cmd(ssh, f"pm2 stop alshifa 2>/dev/null; pm2 delete alshifa 2>/dev/null")

    # Clean old deployment and extract new one
    print("Extracting new build...")
    out, err = run_cmd(ssh, f"""
cd {REMOTE_DIR}
rm -rf .next node_modules public server.js package.json 2>/dev/null
tar xzf /tmp/alshifa-deploy.tar.gz --strip-components=1
rm -f /tmp/alshifa-deploy.tar.gz
echo "=== Files ==="
ls -la
echo ""
echo "=== .next/standalone check ==="
ls .next/standalone/server.js 2>&1
ls .next/standalone/.next/BUILD_ID 2>&1
ls .next/static/chunks/ 2>&1 | head -5
ls public/center-logo.jpg 2>&1
""", timeout=60)
    print(out)
    if err: print(f"ERR: {err}")

    # Start the server
    print("Starting server...")
    out, err = run_cmd(ssh, f"cd {REMOTE_DIR} && pm2 start server.js --name alshifa")
    print(out)

    # Wait for startup
    time.sleep(5)

    # Check status
    out, err = run_cmd(ssh, "pm2 status alshifa")
    print(out)

    # Check logs
    out, err = run_cmd(ssh, "pm2 logs alshifa --lines 10 --nostream 2>&1")
    print(out)

    # Test website
    out, err = run_cmd(ssh, "sleep 2 && curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:3000/")
    print(f"Website status: {out.strip()}")

    sftp.close()
    ssh.close()
    print("Done!")

if __name__ == "__main__":
    main()
