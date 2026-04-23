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

    # Check .env file
    out, err = run_cmd(ssh, "cat /var/www/alshifa/.env 2>&1")
    print(f".env file:\n{out}")

    # Try to run server.js directly to see the error
    out, err = run_cmd(ssh, "cd /var/www/alshifa && node server.js 2>&1", timeout=15)
    print(f"Direct run output:\n{out}")
    print(f"Direct run error:\n{err}")

    # Check if node_modules exists in standalone
    out, err = run_cmd(ssh, "ls /var/www/alshifa/.next/standalone/node_modules/ 2>&1 | head -10")
    print(f"Standalone node_modules: {out}")

    ssh.close()

if __name__ == "__main__":
    main()
