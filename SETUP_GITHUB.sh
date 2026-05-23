#!/bin/bash
# GitHub setup script for feedyourhealth.github.io

echo "🚀 Dietologist - GitHub Pages Setup"
echo "===================================="
echo ""
echo "This script will push your Dietologist app to GitHub Pages"
echo ""
echo "Instructions:"
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named: feedyourhealth.github.io"
echo "3. Make sure your GitHub username is: feedyourhealth"
echo ""
read -p "Have you created the GitHub repository? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd ~/feedyourhealth.github.io
    
    # Add GitHub remote
    git remote add origin https://github.com/feedyourhealth/feedyourhealth.github.io.git
    
    # Rename branch to main if needed
    git branch -M main
    
    # Push to GitHub
    echo "📤 Pushing to GitHub..."
    git push -u origin main
    
    echo ""
    echo "✅ Success! Your Dietologist app is now live at:"
    echo "   https://feedyourhealth.github.io"
    echo ""
else
    echo "Please create the repository first and run this script again."
fi
