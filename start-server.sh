#!/bin/bash
cd /home/z/my-project
while true; do
  HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js 2>/dev/null
  sleep 0.5
done
