import paramiko
import time

HOST = "66.42.113.157"
USER = "root"
PASS = "@Ky8hTV{]NgqV@p)"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)

    # Check PM2 logs
    print("=== PM2 LOGS ===")
    stdin, stdout, stderr = ssh.exec_command("pm2 logs alshifa --lines 30 --nostream")
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(f"STDERR: {err}")

    # Wait a bit and check status
    time.sleep(3)
    print("\n=== PM2 STATUS ===")
    stdin, stdout, stderr = ssh.exec_command("pm2 status")
    print(stdout.read().decode())

    # Check website
    print("\n=== WEBSITE TEST ===")
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:3000/")
    print(stdout.read().decode().strip())

    ssh.close()

if __name__ == "__main__":
    main()
