#!/bin/bash

# --- Environment Setup for Non-Interactive Shell (cron) ---
# Set the user and home directories explicitly
export HOME="/home/ubuntu"
export USER="ubuntu"

# Load NVM (Node Version Manager) to get node, npm, and npx
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
else
    # Fallback default paths if NVM is not present or configured elsewhere
    export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
fi

# Load pnpm (packages and package runner)
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Navigate to project directory
cd /home/ubuntu/nifty-supertrend || { echo "Failed to navigate to project directory"; exit 1; }

# Ensure the logs directory exists
mkdir -p logs

# Run maintenance script (which does build, update scrip, pm2 restart, and init-algo)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting daily maintenance and instance initialization..." >> logs/maintenance.log

# Run with pnpm (or npm fallback)
if command -v pnpm &> /dev/null; then
    pnpm run maintenance >> logs/maintenance.log 2>&1
else
    npm run maintenance >> logs/maintenance.log 2>&1
fi
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Daily maintenance and instance initialization completed successfully." >> logs/maintenance.log
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Daily maintenance and instance initialization failed with exit code $STATUS." >> logs/maintenance.log
fi

exit $STATUS
