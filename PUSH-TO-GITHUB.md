# How to Push to GitHub

Your Git repository is ready! Follow these steps to push to GitHub:

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `coffee-export-blockchain` (or any name you prefer)
3. Description: "Ethiopian Coffee Export Blockchain System"
4. Choose: **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (you already have these)
6. Click "Create repository"

## Step 2: Copy Your Repository URL

After creating, GitHub will show you the repository URL. It looks like:
```
https://github.com/YOUR-ACTUAL-USERNAME/coffee-export-blockchain.git
```

Copy this URL!

## Step 3: Add Remote and Push

Replace `YOUR-ACTUAL-USERNAME` with your GitHub username:

```bash
# Remove the placeholder remote (if exists)
git remote remove origin

# Add your actual repository URL
git remote add origin https://github.com/YOUR-ACTUAL-USERNAME/coffee-export-blockchain.git

# Verify the remote
git remote -v

# Push to GitHub
git push -u origin master
```

## Step 4: Authenticate

When you push, GitHub will ask for credentials:

### Option A: Personal Access Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Coffee Export Blockchain"
4. Select scopes: Check "repo" (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When Git asks for password, paste the token (not your GitHub password)

### Option B: GitHub CLI
```bash
# Install GitHub CLI first
# Then authenticate
gh auth login
```

## Example with Real Username

If your GitHub username is `johndoe`:

```bash
git remote add origin https://github.com/johndoe/coffee-export-blockchain.git
git push -u origin master
```

## Troubleshooting

### "Repository not found"
- Make sure you created the repository on GitHub first
- Check that the username in the URL is correct
- Verify the repository name matches

### "Authentication failed"
- Use a Personal Access Token, not your password
- Generate token at: https://github.com/settings/tokens
- Make sure token has "repo" scope

### "Permission denied"
- Check you're logged into the correct GitHub account
- Verify you have permission to push to the repository

## After Successful Push

Once pushed, you can:
1. View your repository at: `https://github.com/YOUR-USERNAME/coffee-export-blockchain`
2. Share the link with others
3. Set up branch protection
4. Add collaborators
5. Enable GitHub Actions (optional)

## Quick Commands Reference

```bash
# Check current remote
git remote -v

# Change remote URL
git remote set-url origin NEW-URL

# Remove remote
git remote remove origin

# Add remote
git remote add origin URL

# Push to remote
git push -u origin master

# Check status
git status

# View commits
git log --oneline
```

---

**Need help?** See `docs/GIT-GUIDE.md` for more detailed instructions.
