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

# Backup existing config (but keep opencode.json for merging)
if [ -d "$CONFIG_DIR" ]; then
    BACKUP="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    echo "==> Backing up existing config to $BACKUP"
    mkdir -p "$BACKUP"
    for item in AGENTS.md agent command plugin ref skills tui.json; do
        [ -e "$CONFIG_DIR/$item" ] && mv "$CONFIG_DIR/$item" "$BACKUP/" 2>/dev/null || true
    done
    # Backup opencode.json but keep it for merging
    if [ -f "$CONFIG_DIR/opencode.json" ]; then
        cp "$CONFIG_DIR/opencode.json" "$BACKUP/"
    fi
fi

mkdir -p "$CONFIG_DIR"

# Function to merge opencode.json
merge_opencode_json() {
    local source_file="$1"
    local target_file="$2"
    
    # Try Python merge (preferred)
    if command -v python3 &>/dev/null; then
        python3 << 'PYEOF' "$source_file" "$target_file"
import json
import sys

def deep_merge(base, override, path=""):
    """Merge override into base with special handling for specific keys."""
    result = json.loads(json.dumps(base))  # Deep copy
    
    for key, value in override.items():
        if key in result:
            # Keys that should NOT override existing values
            if key in ("model", "small_model", "$schema"):
                # Keep existing value, don't override
                continue
            
            # Keys that should deep merge
            if key in ("provider", "mcp"):
                # Deep merge objects
                if isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value, f"{path}.{key}")
                else:
                    result[key] = value
            elif key == "permission":
                # Merge permission objects
                if isinstance(result[key], dict) and isinstance(value, dict):
                    for perm_key, perm_val in value.items():
                        if perm_key in result[key]:
                            if isinstance(result[key][perm_key], dict) and isinstance(perm_val, dict):
                                result[key][perm_key].update(perm_val)
                            else:
                                result[key][perm_key] = perm_val
                        else:
                            result[key][perm_key] = perm_val
                else:
                    result[key] = value
            elif key == "plugin":
                # Merge plugin arrays, dedupe
                if isinstance(result[key], list) and isinstance(value, list):
                    existing = set(result[key])
                    for item in value:
                        if item not in existing:
                            result[key].append(item)
                else:
                    result[key] = value
            elif key == "instructions":
                # Merge instructions arrays, dedupe
                if isinstance(result[key], list) and isinstance(value, list):
                    existing = set(result[key])
                    for item in value:
                        if item not in existing:
                            result[key].append(item)
                else:
                    result[key] = value
            else:
                # Default: override
                result[key] = value
        else:
            result[key] = value
    
    return result

source_file = sys.argv[1]
target_file = sys.argv[2]

try:
    with open(source_file, 'r') as f:
        source = json.load(f)
except FileNotFoundError:
    print(f"Source file not found: {source_file}")
    sys.exit(1)

try:
    with open(target_file, 'r') as f:
        target = json.load(f)
    # Merge: target is existing config, source is new config
    merged = deep_merge(target, source)
except FileNotFoundError:
    # No existing config, use source directly
    merged = source

with open(target_file, 'w') as f:
    json.dump(merged, f, indent=2)
    f.write('\n')

print(f"Merged config saved to {target_file}")
PYEOF
        return $?
    fi
    
    # Fallback: try jq if available
    if command -v jq &>/dev/null; then
        if [ -f "$target_file" ]; then
            # Simple merge with jq (less smart than Python)
            tmp_file=$(mktemp)
            jq -s '.[0] * .[1]' "$target_file" "$source_file" > "$tmp_file" && mv "$tmp_file" "$target_file"
        else
            cp "$source_file" "$target_file"
        fi
        return $?
    fi
    
    # Last resort: just copy (warn user)
    echo "Warning: Neither python3 nor jq found, cannot merge config. Copying as-is."
    cp "$source_file" "$target_file"
}

# Install
if [ "$MODE" = "copy" ]; then
    echo "==> Copying files..."
    if [ "$IS_GIT_REPO" = true ]; then
        # Handle opencode.json separately for merging
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            # Backup original for merge
            cp "$CONFIG_DIR/opencode.json" "$CONFIG_DIR/opencode.json.bak"
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            cp "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Copy other files
        for item in AGENTS.md agent command plugin ref skills tui.json; do
            [ -e "$REPO_DIR/$item" ] && cp -r "$REPO_DIR/$item" "$CONFIG_DIR/"
        done
    else
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        git clone --depth 1 https://github.com/your-username/opencode-config.git "$TEMP_DIR" 2>/dev/null
        # Handle opencode.json separately for merging
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$TEMP_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            cp "$CONFIG_DIR/opencode.json" "$CONFIG_DIR/opencode.json.bak"
            merge_opencode_json "$TEMP_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            cp "$TEMP_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        for item in AGENTS.md agent command plugin ref skills tui.json; do
            [ -e "$TEMP_DIR/$item" ] && cp -r "$TEMP_DIR/$item" "$CONFIG_DIR/"
        done
    fi
else
    if [ "$IS_GIT_REPO" = true ]; then
        echo "==> Creating symlinks..."
        # Handle opencode.json separately for merging in link mode
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            cp "$CONFIG_DIR/opencode.json" "$CONFIG_DIR/opencode.json.bak"
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            ln -sf "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Link other files
        for item in AGENTS.md agent command plugin ref skills tui.json; do
            [ -e "$REPO_DIR/$item" ] && ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    else
        echo "==> Cloning repository..."
        REPO_DIR="$HOME/opencode-config"
        git clone --depth 1 https://github.com/your-username/opencode-config.git "$REPO_DIR" 2>/dev/null || {
            cd "$REPO_DIR" && git pull
        }
        # Handle opencode.json separately for merging in link mode
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            cp "$CONFIG_DIR/opencode.json" "$CONFIG_DIR/opencode.json.bak"
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            ln -sf "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        for item in AGENTS.md agent command plugin ref skills tui.json; do
            [ -e "$REPO_DIR/$item" ] && ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    fi
fi

echo "==> Installation complete!"