import paramiko
import os
import tarfile
import io

# Server details
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

    # First, stop the PM2 process
    print("Stopping alshifa process...")
    stdin, stdout, stderr = ssh.exec_command("cd /var/www/alshifa && pm2 stop alshifa 2>/dev/null; pm2 delete alshifa 2>/dev/null; echo 'done'")
    print(stdout.read().decode().strip())

    # Create tar archive of the deployment
    print("Creating deployment archive...")
    local_dir = "/home/z/my-project/deploy/alshifa"
    
    # Upload files one by one via SFTP
    def upload_dir(local_path, remote_path):
        """Recursively upload a directory"""
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            sftp.mkdir(remote_path)
        
        for item in os.listdir(local_path):
            local_item = os.path.join(local_path, item)
            remote_item = f"{remote_path}/{item}"
            if os.path.isfile(local_item):
                print(f"  Uploading: {item}")
                sftp.put(local_item, remote_item)
            elif os.path.isdir(local_item):
                upload_dir(local_item, remote_item)
    
    print("Uploading files to server...")
    upload_dir(local_dir, REMOTE_DIR)
    print("All files uploaded!")

    # Restart PM2
    print("Starting alshifa process...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_DIR} && pm2 start server.js --name alshifa && pm2 save")
    output = stdout.read().decode()
    err = stderr.read().decode()
    print(output)
    if err:
        print(f"STDERR: {err}")

    # Verify
    print("Verifying deployment...")
    stdin, stdout, stderr = ssh.exec_command("pm2 status alshifa")
    print(stdout.read().decode())

    # Test the website
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
    status = stdout.read().decode().strip()
    print(f"Website status: HTTP {status}")

    sftp.close()
    ssh.close()
    print("Deployment complete!")

if __name__ == "__main__":
    main()
