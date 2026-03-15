#!/bin/bash
# OpenCode Config Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/USER/REPO/main/install.sh | bash
#   ./install.sh [--copy|--link]
#
# Modes:
#   --link  Create symlinks (default, allows git pull updates)
#   --copy  Copy files (standalone installation)

set -e

CONFIG_DIR="$HOME/.config/opencode"
MODE="link"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --copy) MODE="copy" ;;
        --link) MODE="link" ;;
    esac
done

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IS_GIT_REPO=false

if [ -d "$SCRIPT_DIR/.git" ]; then
    IS_GIT_REPO=true
    REPO_DIR="$SCRIPT_DIR"
fi

echo "==> Installing opencode-config (mode: $MODE)"

# Backup existing config
if [ -d "$CONFIG_DIR" ]; then
    BACKUP="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    echo "==> Backing up existing config to $BACKUP"
    mkdir -p "$BACKUP"
    for item in AGENTS.md agent command opencode.json plugin ref skills tui.json; do
        [ -e "$CONFIG_DIR/$item" ] && mv "$CONFIG_DIR/$item" "$BACKUP/" 2>/dev/null || true
    done
fi

mkdir -p "$CONFIG_DIR"

# Install
if [ "$MODE" = "copy" ]; then
    echo "==> Copying files..."
    if [ "$IS_GIT_REPO" = true ]; then
        cp -r "$REPO_DIR"/{AGENTS.md,agent,command,opencode.json,plugin,ref,skills,tui.json} "$CONFIG_DIR/"
    else
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        git clone --depth 1 https://github.com/your-username/opencode-config.git "$TEMP_DIR" 2>/dev/null
        cp -r "$TEMP_DIR"/{AGENTS.md,agent,command,opencode.json,plugin,ref,skills,tui.json} "$CONFIG_DIR/"
    fi
else
    if [ "$IS_GIT_REPO" = true ]; then
        echo "==> Creating symlinks..."
        for item in AGENTS.md agent command opencode.json plugin ref skills tui.json; do
            ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    else
        echo "==> Cloning repository..."
        REPO_DIR="$HOME/opencode-config"
        git clone --depth 1 https://github.com/your-username/opencode-config.git "$REPO_DIR" 2>/dev/null || {
            cd "$REPO_DIR" && git pull
        }
        for item in AGENTS.md agent command opencode.json plugin ref skills tui.json; do
            ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    fi
fi
