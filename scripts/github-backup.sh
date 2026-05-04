#!/bin/bash

# Configuration
REPO_PATH="/home/pi/3DRiojaRemake"
BRANCH="main"

cd "$REPO_PATH" || exit

# Check if there are changes
if [[ -z $(git status --porcelain) ]]; then
  echo "$(date): No changes to backup."
  exit 0
fi

# Add changes
git add .

# Commit
git commit -m "chore: automated weekly backup $(date +'%Y-%m-%d') [skip ci]"

# Push
# Note: This assumes SSH keys are configured or a PAT is stored in the helper
git push origin "$BRANCH"

echo "$(date): Backup completed successfully."
