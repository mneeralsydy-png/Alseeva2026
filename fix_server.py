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

    # Check what's on port 3000
    out, err = run_cmd(ssh, "ss -tlnp | grep 3000")
    print(f"Port 3000: {out.strip()}")

    # Check if node is listening
    out, err = run_cmd(ssh, "netstat -tlnp 2>/dev/null | grep 3000 || echo 'no netstat'")
    print(f"Netstat: {out.strip()}")

    # Try curl with verbose
    out, err = run_cmd(ssh, "curl -v http://localhost:3000/ 2>&1 | head -20")
    print(f"Curl verbose:\n{out}")

    # Check PM2 status
    out, err = run_cmd(ssh, "pm2 jlist 2>/dev/null | python3 -m json.tool | head -30")
    print(f"PM2 detail:\n{out}")

    # Try restarting with fresh logs
    out, err = run_cmd(ssh, "cd /var/www/alshifa && pm2 flush alshifa && pm2 restart alshifa")
    print(f"Restart: {out}")

    time.sleep(8)

    # Check fresh logs
    out, err = run_cmd(ssh, "pm2 logs alshifa --lines 20 --nostream 2>&1")
    print(f"Fresh logs:\n{out}")

    # Try curl again
    out, err = run_cmd(ssh, "curl -s -o /dev/null -w 'HTTP %{http_code}\n' --max-time 10 http://localhost:3000/")
    print(f"Website: {out.strip()}")

    ssh.close()

if __name__ == "__main__":
    main()
