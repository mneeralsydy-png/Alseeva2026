import paramiko

HOST = "66.42.113.157"
USER = "root"
PASS = "@Ky8hTV{]NgqV@p}"

def run_cmd(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(), stderr.read().decode()

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)

    # Test the login API
    out, err = run_cmd(ssh, "curl -s http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"Hi\",\"password\":\"Hi123\"}'")
    print(f"Login API: {out.strip()}")

    # Test the dashboard API
    out, err = run_cmd(ssh, "curl -s http://localhost:3000/api/dashboard")
    print(f"Dashboard API: {out.strip()[:200]}")

    # Check if Supabase code is in the JS bundle
    out, err = run_cmd(ssh, "grep -rl 'ntshduvxdehefxmchusw' /var/www/alshifa/.next/standalone/.next/ 2>/dev/null | head -3")
    print(f"Supabase code in: {out.strip()}")

    # Check if the key fallback is correct
    out, err = run_cmd(ssh, "grep -o 'sb_publishable[^\"'\'']*' /var/www/alshifa/.next/standalone/.next/static/chunks/*.js 2>/dev/null | head -1")
    print(f"Supabase key: {out.strip()}")

    # Test from external URL
    out, err = run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' https://abualzahracom.online/")
    print(f"External URL: HTTP {out.strip()}")

    # Save PM2 startup config
    run_cmd(ssh, "pm2 save && pm2 startup 2>/dev/null")
    
    ssh.close()
    print("\nVerification complete!")

if __name__ == "__main__":
    main()
