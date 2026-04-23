import paramiko
import time

HOST = "66.42.113.157"
USER = "root"
PASS = "@Ky8hTV{]NgqV@p)"

def run_cmd(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(), stderr.read().decode()

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)

    # Kill any existing process
    run_cmd(ssh, "pm2 delete alshifa 2>/dev/null; fuser -k 3000/tcp 2>/dev/null")
    time.sleep(2)

    # Copy .env to standalone dir
    run_cmd(ssh, "cp /var/www/alshifa/.env /var/www/alshifa/.next/standalone/.env")

    # Start the standalone server directly
    print("Starting standalone server directly...")
    out, err = run_cmd(ssh, 
        "cd /var/www/alshifa/.next/standalone && pm2 start server.js --name alshifa")
    print(f"Start: {out}")
    print(f"Err: {err}")

    time.sleep(8)

    # Check status
    out, err = run_cmd(ssh, "pm2 status")
    print(f"\nStatus:\n{out}")

    # Check logs
    out, err = run_cmd(ssh, "pm2 logs alshifa --lines 15 --nostream 2>&1")
    print(f"Logs:\n{out}")

    # Test website
    out, err = run_cmd(ssh, "curl -s -o /dev/null -w 'HTTP %{http_code}\n' --max-time 10 http://localhost:3000/")
    print(f"Website: {out.strip()}")

    if "200" in out.strip():
        # Save PM2 config
        run_cmd(ssh, "pm2 save")
        print("Server is running! Saved PM2 config.")
    else:
        # Debug more
        out, err = run_cmd(ssh, "ss -tlnp | grep 3000")
        print(f"Port 3000: '{out.strip()}'")

    ssh.close()

if __name__ == "__main__":
    main()
