# 🚀 IBS Itassist Broadcast Solutions - Deployment Guide

## 📋 Overview

This guide covers deploying the IBS Itassist Broadcast Solutions dashboard to GitHub and Vercel with automatic CI/CD.

## 🔧 Prerequisites

- GitHub account
- Vercel account
- Node.js 18+ installed locally
- Git configured

## 📦 GitHub Repository Setup

### 1. Create GitHub Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: IBS Itassist Broadcast Solutions"

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/ibs-itassist-broadcast-solutions.git

# Push to GitHub
git push -u origin main
```

### 2. Repository Settings

1. Go to your GitHub repository
2. Navigate to **Settings** → **General**
3. Update repository name to: `ibs-itassist-broadcast-solutions`
4. Update description: "IBS Itassist Broadcast Solutions - OvenMediaEngine Compliance Dashboard"
5. Add topics: `broadcast`, `streaming`, `compliance`, `scte35`, `ome`

## 🌐 Vercel Deployment

### 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your GitHub repository: `ibs-itassist-broadcast-solutions`

### 2. Vercel Configuration

The `vercel.json` file is already configured with:

```json
{
  "name": "ibs-itassist-broadcast-solutions",
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### 3. Environment Variables (Optional)

If you need environment variables for production:

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add any required variables:
   - `NODE_ENV=production`
   - `VITE_APP_TITLE=IBS Itassist Broadcast Solutions`

## 🔄 Automatic Deployment

### GitHub Actions Workflow

The `.github/workflows/deploy.yml` file is configured for automatic deployment:

```yaml
name: Deploy IBS Itassist Broadcast Solutions

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Build project
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./
```

### Required GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

```
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_vercel_org_id
PROJECT_ID=your_vercel_project_id
```

### Getting Vercel Credentials

1. **VERCEL_TOKEN**: 
   - Go to Vercel → Settings → Tokens
   - Create a new token

2. **ORG_ID & PROJECT_ID**:
   - Run: `npx vercel link`
   - Check `.vercel/project.json` for IDs

## 🚀 Deployment Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Production Deployment

```bash
# Deploy to Vercel (if using Vercel CLI)
npx vercel --prod

# Or push to GitHub (automatic deployment)
git add .
git commit -m "Deploy: Update IBS Itassist Broadcast Solutions"
git push origin main
```

## 🔧 Custom Domain (Optional)

### 1. Add Custom Domain in Vercel

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Add your custom domain (e.g., `ibs-itassist.com`)

### 2. DNS Configuration

Configure your DNS provider:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

- Built-in analytics in Vercel dashboard
- Performance monitoring
- Error tracking

### 2. GitHub Actions Monitoring

- Check Actions tab in GitHub repository
- Monitor deployment status
- View build logs

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (18+)
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **Deployment Issues**:
   - Verify Vercel tokens are correct
   - Check GitHub secrets configuration
   - Ensure repository permissions

3. **Environment Variables**:
   - Verify all required env vars are set
   - Check Vercel environment configuration

### Debug Commands

```bash
# Check build locally
npm run build

# Test production build
npm run preview

# Check Vercel configuration
npx vercel --version
```

## 📈 Performance Optimization

### 1. Build Optimization

- Vite automatically optimizes builds
- Code splitting enabled
- Tree shaking for smaller bundles

### 2. CDN Configuration

- Vercel provides global CDN
- Automatic HTTPS
- Edge caching

## 🎯 Success Checklist

- [ ] GitHub repository created and configured
- [ ] Vercel project connected to GitHub
- [ ] GitHub Actions workflow configured
- [ ] Required secrets added to GitHub
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup complete

## 📞 Support

For deployment issues:

1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify all configuration files
4. Test local build first

---

**IBS Itassist Broadcast Solutions** is now ready for production deployment! 🚀
