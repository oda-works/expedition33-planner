#!/bin/bash

# 🚀 Expedition 33 Planner - GitHub Pages Deployment Script

echo "🚀 Starting GitHub Pages deployment..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Run 'git init' first."
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Found uncommitted changes. Adding and committing..."
    git add .
    git commit -m "feat: deploy modern SPA with sidebar navigation to GitHub Pages"
else
    echo "✅ No uncommitted changes found."
fi

# Check if origin remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Error: No origin remote found."
    echo "Please add your GitHub repository as origin:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    exit 1
fi

# Get the current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📋 Current branch: $BRANCH"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin $BRANCH

echo "✅ Deployment initiated!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Pages"
echo "3. Set Source to 'GitHub Actions'"
echo ""
echo "🌐 Your site will be available at:"
echo "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/"
echo ""
echo "📊 Check deployment status at:"
echo "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions"
echo ""
echo "🎉 Deployment complete!"