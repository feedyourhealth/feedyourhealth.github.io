#!/bin/bash
# Automatic update script for Dietologist GitHub Pages

SOURCE="/c/Users/steph/OneDrive/Desktop/Dietologist.html"
REPO="$HOME/feedyourhealth.github.io"
INDEX="$REPO/index.html"

echo "🔄 Dietologist - Update to GitHub"
echo "=================================="

# Check if source file exists
if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: Dietologist.html not found at $SOURCE"
    exit 1
fi

# Copy updated file
echo "📋 Copying updated Dietologist.html..."
cp "$SOURCE" "$INDEX"

# Navigate to repo
cd "$REPO"

# Check if there are changes
if git diff --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

# Stage changes
git add index.html

# Create commit
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
git commit -m "Update Dietologist app - $TIMESTAMP"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! App updated and live at:"
    echo "   https://feedyourhealth.github.io"
    echo ""
else
    echo "❌ Push failed. Make sure:"
    echo "   1. You've authenticated with GitHub (git push will prompt for credentials)"
    echo "   2. The remote is configured: git remote -v"
    echo "   3. The branch is 'main': git branch"
fi
