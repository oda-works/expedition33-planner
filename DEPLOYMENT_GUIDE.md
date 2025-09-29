# 🚀 GitHub Pages Deployment Guide

## Quick Deploy to GitHub Pages

### **1. Push to GitHub (if not already done):**

```bash
# Initialize git repo (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "feat: modern SPA transformation with sidebar navigation"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to main branch
git push -u origin main
```

### **2. Enable GitHub Pages:**

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically deploy when you push to main

### **3. Access Your Live Site:**

Your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## 🔧 **Automatic Deployment**

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
- ✅ Automatically deploy on every push to main branch
- ✅ Set up GitHub Pages environment
- ✅ Deploy all static files
- ✅ Make site available at your GitHub Pages URL

## 🧪 **Testing Your Deployment**

Once deployed, test these URLs on your GitHub Pages site:

1. **Main App**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
2. **Working Demo**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/working-demo.html`
3. **Debug Tool**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/debug.html`

## 📋 **What Gets Deployed**

Your GitHub Pages site will include:
- ✅ Modern SPA with sidebar navigation
- ✅ All original features (Character Builder, Pictos, etc.)
- ✅ Mobile-responsive design
- ✅ Hash-based routing (`#/characters`, `#/party`, etc.)
- ✅ All CSS, JS, and data files
- ✅ Debug and test tools

## 🐛 **Troubleshooting**

### **If deployment fails:**
1. Check **Actions** tab in your GitHub repo for error logs
2. Ensure repository is public (or you have GitHub Pro for private repos)
3. Make sure the workflow file is in `.github/workflows/deploy.yml`

### **If site doesn't work correctly:**
1. Check browser console for errors
2. Verify all paths are relative (no absolute paths)
3. Test locally first with `python3 -m http.server 8000`

## 🎯 **Expected Result**

After deployment, you'll have a professional, modern single-page application with:
- 🔧 **Organized sidebar navigation** instead of messy tabs
- 📱 **Mobile-responsive design** with hamburger menu
- 🗺️ **URL routing** with browser history support
- ✨ **All original features** preserved and enhanced

---

**Need help?** Check the Actions tab in your GitHub repository for deployment status and logs.