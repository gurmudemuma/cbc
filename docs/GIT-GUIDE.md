# Git Setup and Push Guide

## Prerequisites

1. Git installed on your system
   - Download: https://git-scm.com/download/win
   - Verify: `git --version`

2. GitHub/GitLab/Bitbucket account
   - Create repository on your platform
   - Copy repository URL

## Quick Start (Automated)

### Option 1: Use Automated Script

```bash
# Run the initialization script
INITIALIZE-GIT.bat

# Follow the prompts
# Then add your remote and push
git remote add origin [your-repo-url]
git push -u origin main
```

### Option 2: Manual Setup

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "feat: Ethiopian Coffee Export Blockchain System"

# 4. Add remote repository
git remote add origin [your-repo-url]

# 5. Push to remote
git push -u origin main
```

## Verification Before Push

Run the verification script to ensure everything is ready:

```bash
VERIFY-GIT-READY.bat
```

This checks:
- Git repository status
- .gitignore configuration
- Documentation structure
- Startup scripts
- Temporary files
- Sensitive files

## What Gets Committed

### Included Files
- Source code (chaincode, gateway, services, frontend)
- Docker configurations
- Documentation (docs/)
- Startup scripts
- README.md
- .gitignore

### Excluded Files (by .gitignore)
- node_modules/
- .env files
- Build outputs (dist/, build/)
- Logs
- crypto-config/
- wallets/
- Database files
- Temporary files

## Repository Structure

```
coffee-export-blockchain/
├── README.md                    # Main documentation
├── .gitignore                   # Git ignore rules
├── START-HYBRID.bat            # Start all services
├── STOP-HYBRID.bat             # Stop all services
├── REBUILD-FRONTEND.bat        # Rebuild frontend
├── GIT-READY.bat               # Pre-push preparation
├── VERIFY-GIT-READY.bat        # Verify readiness
├── INITIALIZE-GIT.bat          # Initialize Git repo
│
├── docs/                        # Documentation
│   ├── INDEX.md                # Documentation index
│   ├── README-START-HERE.md    # Quick start guide
│   ├── HYBRID-SYSTEM-GUIDE.md  # Complete guide
│   ├── GIT-GUIDE.md            # This file
│   └── architecture/           # Architecture docs
│
├── chaincode/                   # Smart contracts
│   └── ecta/                   # ECTA chaincode
│
├── coffee-export-gateway/       # Gateway API
│   ├── src/                    # Source code
│   ├── Dockerfile              # Docker config
│   └── package.json            # Dependencies
│
├── cbc/                         # CBC services
│   ├── frontend/               # React frontend
│   └── services/               # Backend services
│
├── services/                    # Additional services
│   └── blockchain-bridge/      # Data sync service
│
├── config/                      # Fabric config
├── scripts/                     # Utility scripts
└── docker-compose-*.yml         # Docker configs
```

## Common Git Commands

### Daily Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: Add new feature"

# Push to remote
git push

# Pull latest changes
git pull
```

### Branch Management

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# List branches
git branch

# Delete branch
git branch -d feature/old-feature
```

### Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View changes
git diff
```

## Commit Message Convention

Use conventional commits format:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat: Add business types registration"

# Bug fix
git commit -m "fix: Resolve registration validation error"

# Documentation
git commit -m "docs: Update README with setup instructions"

# Multiple changes
git commit -m "feat: Add export workflow

- Implement export creation
- Add validation logic
- Update frontend forms"
```

## Troubleshooting

### Git Not Installed

```bash
# Download and install Git
https://git-scm.com/download/win

# Verify installation
git --version
```

### Large Files Error

If you get errors about large files:

```bash
# Check file sizes
git ls-files -z | xargs -0 du -h | sort -h

# Remove large files from staging
git rm --cached path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore
```

### Authentication Issues

For HTTPS:
```bash
# Use personal access token instead of password
# GitHub: Settings > Developer settings > Personal access tokens
```

For SSH:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub/GitLab
cat ~/.ssh/id_ed25519.pub
```

### Undo Last Commit

```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

### Discard Local Changes

```bash
# Discard all changes
git reset --hard HEAD

# Discard specific file
git checkout -- path/to/file
```

## Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Clear Messages**: Describe what and why
3. **Pull Before Push**: Always pull latest changes first
4. **Use Branches**: Create branches for features
5. **Review Changes**: Check `git status` and `git diff` before committing
6. **Don't Commit Secrets**: Never commit .env files or credentials
7. **Keep .gitignore Updated**: Add patterns for generated files

## Remote Repository Setup

### GitHub

```bash
# Create repository on GitHub
# Then add remote
git remote add origin https://github.com/username/coffee-export-blockchain.git
git push -u origin main
```

### GitLab

```bash
# Create repository on GitLab
# Then add remote
git remote add origin https://gitlab.com/username/coffee-export-blockchain.git
git push -u origin main
```

### Bitbucket

```bash
# Create repository on Bitbucket
# Then add remote
git remote add origin https://bitbucket.org/username/coffee-export-blockchain.git
git push -u origin main
```

## Continuous Integration

After pushing, consider setting up:

1. **GitHub Actions** - Automated testing and deployment
2. **GitLab CI/CD** - Pipeline automation
3. **Docker Hub** - Automated image builds
4. **Code Quality Tools** - ESLint, Prettier, SonarQube

## Support

For Git help:
- Official documentation: https://git-scm.com/doc
- GitHub guides: https://guides.github.com/
- Git cheat sheet: https://education.github.com/git-cheat-sheet-education.pdf

---

**Ready to push? Run `VERIFY-GIT-READY.bat` to ensure everything is set!**
