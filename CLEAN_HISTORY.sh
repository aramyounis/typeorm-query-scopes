#!/bin/bash

# Script to clean git history and start fresh
# WARNING: This will erase all commit history!

echo "⚠️  WARNING: This will erase all commit history!"
echo "Current files will be preserved, but all commits will be removed."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🗑️  Removing old git history..."
rm -rf .git

echo "🆕 Initializing fresh repository..."
git init

echo "📝 Adding all files..."
git add .

echo "💾 Creating initial commit..."
git commit -m "Initial release: typeorm-query-scopes v0.1.0-beta.1

Features:
- Decorator-based scopes for TypeORM entities
- Type-safe scope names with IDE autocomplete
- Default scopes and named scopes
- Function scopes with parameters
- Intelligent scope merging
- Zero performance overhead
- Full TypeScript support
- Comprehensive documentation site"

echo "🔗 Adding remote..."
git remote add origin git@github.com:aramyounis/typeorm-query-scopes.git

echo ""
echo "✅ Done! Your repository now has a clean history."
echo ""
echo "To push to GitHub, run:"
echo "  git push -f origin main"
echo ""
echo "⚠️  Note: This will replace all history on GitHub!"
