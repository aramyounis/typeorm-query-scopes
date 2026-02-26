#!/bin/bash

echo "🧹 Cleaning git history and preparing v1.0.0 release..."
echo ""
echo "This will:"
echo "  1. Remove all old commits"
echo "  2. Create one clean commit for v1.0.0"
echo "  3. Keep all your current files"
echo ""
read -p "Continue? (yes/no): " confirm

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

echo "💾 Creating v1.0.0 release commit..."
git commit -m "Release v1.0.0

TypeORM Query Scopes - Reusable query patterns for TypeORM

Features:
- Decorator-based scopes (@Scopes, @DefaultScope)
- Type-safe scope names with IDE autocomplete
- Function scopes with runtime parameters
- Intelligent scope merging and composition
- Zero performance overhead
- Full TypeScript support (ES2017+)
- Comprehensive documentation site

Documentation: https://aramyounis.github.io/typeorm-query-scopes/
npm: https://www.npmjs.com/package/typeorm-query-scopes"

echo "🏷️  Creating v1.0.0 tag..."
git tag -a v1.0.0 -m "Release v1.0.0 - Initial stable release"

echo "🔗 Adding remote..."
git remote add origin git@github.com:aramyounis/typeorm-query-scopes.git

echo ""
echo "✅ Done! Clean history created with v1.0.0"
echo ""
echo "To push to GitHub:"
echo "  git push -f origin main"
echo "  git push -f origin v1.0.0"
echo ""
echo "⚠️  This will replace all history on GitHub!"
