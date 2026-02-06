#!/bin/bash

# MegaBrain Skill Installer
# Usage: curl -fsSL https://megabrain-mvp.vercel.app/install.sh | bash

set -e

SKILL_NAME="megabrain"
INSTALL_DIR="${HOME}/.openclaw/skills/${SKILL_NAME}"
REPO_URL="https://github.com/LemmyAI/megabrain-protocol"
VERSION="${1:-main}"

echo "🧠 Installing MegaBrain Protocol Skill..."

# Check if already installed
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Skill already installed at $INSTALL_DIR"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    rm -rf "$INSTALL_DIR"
fi

# Create directory
mkdir -p "$INSTALL_DIR"

echo "📥 Downloading skill files..."

# Download files directly from GitHub raw
curl -fsSL "${REPO_URL}/raw/${VERSION}/megabrain-mvp/skill/SKILL.md" > "$INSTALL_DIR/SKILL.md"
curl -fsSL "${REPO_URL}/raw/${VERSION}/megabrain-mvp/skill/package.json" > "$INSTALL_DIR/package.json"
curl -fsSL "${REPO_URL}/raw/${VERSION}/megabrain-mvp/skill/scripts/megabrain.js" > "$INSTALL_DIR/megabrain.js"
curl -fsSL "${REPO_URL}/raw/${VERSION}/megabrain-mvp/skill/config/default.json" > "$INSTALL_DIR/config.json"

# Make executable
chmod +x "$INSTALL_DIR/megabrain.js"

# Create symlink for global access
BIN_DIR="${HOME}/.local/bin"
mkdir -p "$BIN_DIR"

if [ -L "$BIN_DIR/mbp" ]; then
    rm "$BIN_DIR/mbp"
fi

ln -s "$INSTALL_DIR/megabrain.js" "$BIN_DIR/mbp"

# Install Node dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent

# Add to PATH if needed
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo "⚠️  Please add the following to your shell profile:"
    echo "export PATH=\"$BIN_DIR:\$PATH\""
    echo ""
fi

echo ""
echo "✅ MegaBrain skill installed successfully!"
echo ""
echo "🚀 Quick start:"
echo "   mbp status              # Check your balance"
echo "   mbp tasks list          # Browse available tasks"
echo "   mbp --help              # Show all commands"
echo ""
echo "📖 Documentation: $INSTALL_DIR/SKILL.md"
echo ""
echo "⚙️  Configure: Edit ~/.megabrain/config.json"
echo ""
