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

    # Kill any existing process on port 3000
    run_cmd(ssh, "pm2 delete alshifa 2>/dev/null; fuser -k 3000/tcp 2>/dev/null")

    # Run with NODE_DEBUG
    print("=== Running with debug ===")
    out, err = run_cmd(ssh, 
        "cd /var/www/alshifa && timeout 10 node server.js 2>&1 || echo 'EXIT CODE:'$?",
        timeout=20)
    print(f"Output: {out}")
    print(f"Error: {err}")

    # Check if there's an issue with the standalone server
    print("\n=== Running standalone server directly ===")
    out, err = run_cmd(ssh, 
        "cd /var/www/alshifa/.next/standalone && timeout 10 node server.js 2>&1 || echo 'EXIT CODE:'$?",
        timeout=20)
    print(f"Output: {out}")
    print(f"Error: {err}")

    ssh.close()

if __name__ == "__main__":
    main()
