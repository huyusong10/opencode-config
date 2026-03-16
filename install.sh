#!/bin/bash
# OpenCode Config Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/huyusong10/opencode-config/main/install.sh | bash
#   ./install.sh [--link]
#
# Modes:
#   --copy  Copy files (default, standalone installation)
#   --link  Create symlinks (debug mode, may conflict with existing configs)

set -e

CONFIG_DIR="$HOME/.config/opencode"
MODE="copy"

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

# Check if config directory is writable
if [ -d "$CONFIG_DIR" ]; then
    if [ ! -w "$CONFIG_DIR" ]; then
        echo "==> ERROR: Config directory '$CONFIG_DIR' is not writable."
        echo "==> Please check permissions or run with appropriate user."
        exit 1
    fi
else
    # Try to create config directory
    if ! mkdir -p "$CONFIG_DIR" 2>/dev/null; then
        echo "==> ERROR: Cannot create config directory '$CONFIG_DIR'."
        echo "==> Please check permissions: mkdir -p $CONFIG_DIR"
        exit 1
    fi
fi

# Backup existing config (but keep opencode.json for merging)
if [ -d "$CONFIG_DIR" ]; then
    BACKUP="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    
    # Check if backup directory already exists (rare edge case)
    if [ -d "$BACKUP" ]; then
        echo "==> WARNING: Backup directory already exists, appending timestamp..."
        BACKUP="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)_$$"
    fi
    
    echo "==> Backing up existing config to $BACKUP"
    if ! mkdir -p "$BACKUP" 2>/dev/null; then
        echo "==> ERROR: Cannot create backup directory '$BACKUP'."
        exit 1
    fi
    
    for item in AGENTS.md agent command plugin skills tui.json rules; do
        if [ -e "$CONFIG_DIR/$item" ]; then
            if ! mv "$CONFIG_DIR/$item" "$BACKUP/" 2>/dev/null; then
                echo "==> WARNING: Failed to backup '$item', skipping..."
            fi
        fi
    done
    # Backup opencode.json separately (copy, not move — keeps it in place for merging)
    if [ -f "$CONFIG_DIR/opencode.json" ]; then
        cp "$CONFIG_DIR/opencode.json" "$BACKUP/opencode.json" 2>/dev/null || true
    fi
fi

mkdir -p "$CONFIG_DIR" || {
    echo "==> ERROR: Cannot create config directory '$CONFIG_DIR'. Permission denied?"
    exit 1
}

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
            
            # Keys that should deep merge objects
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
    print(f"ERROR: Source file not found: {source_file}")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"ERROR: Invalid JSON in source file: {e}")
    sys.exit(1)

try:
    with open(target_file, 'r') as f:
        target = json.load(f)
    # Merge: target is existing config, source is new config
    merged = deep_merge(target, source)
except FileNotFoundError:
    # No existing config, use source directly
    merged = source
except json.JSONDecodeError as e:
    print(f"ERROR: Invalid JSON in existing config: {e}")
    print("Falling back to using source config directly...")
    merged = source

try:
    with open(target_file, 'w') as f:
        json.dump(merged, f, indent=2)
        f.write('\n')
    print(f"Merged config saved to {target_file}")
except IOError as e:
    print(f"ERROR: Failed to write merged config: {e}")
    sys.exit(1)
PYEOF
        return $?
    fi
    
    # Fallback: try jq if available
    if command -v jq &>/dev/null; then
        if [ -f "$target_file" ]; then
            # Simple merge with jq (less smart than Python)
            tmp_file=$(mktemp)
            if jq -s '.[0] * .[1]' "$target_file" "$source_file" > "$tmp_file" && mv "$tmp_file" "$target_file"; then
                echo "Merged config saved to $target_file (using jq)"
            else
                echo "ERROR: Failed to merge config with jq"
                return 1
            fi
        else
            cp "$source_file" "$target_file"
        fi
        return $?
    fi
    
    # Last resort: just copy (warn user)
    echo "WARNING: Neither python3 nor jq found, cannot merge config properly. Copying as-is."
    cp "$source_file" "$target_file"
}

# Files and directories to install (excluding ref/, .planning/, .worktrees/, caches, etc.)
INSTALL_ITEMS="AGENTS.md agent command plugin skills tui.json rules scripts opencode.json"

# Install
if [ "$MODE" = "copy" ]; then
    echo "==> Copying files..."
    if [ "$IS_GIT_REPO" = true ]; then
        # Handle opencode.json separately for merging
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            cp "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Copy other files (excluding ref/)
        for item in $INSTALL_ITEMS; do
            [ "$item" = "opencode.json" ] && continue  # Already handled
            [ -e "$REPO_DIR/$item" ] && cp -r "$REPO_DIR/$item" "$CONFIG_DIR/"
        done
    else
        TEMP_DIR=$(mktemp -d)
        trap 'rm -rf "$TEMP_DIR"' EXIT
        echo "==> Cloning repository to temporary directory..."
        if ! git clone --depth 1 https://github.com/huyusong10/opencode-config.git "$TEMP_DIR" 2>/dev/null; then
            echo "==> ERROR: Failed to clone repository. Please check your network connection."
            exit 1
        fi
        # Handle opencode.json separately for merging
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$TEMP_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            merge_opencode_json "$TEMP_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            cp "$TEMP_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Copy other files (excluding ref/)
        for item in $INSTALL_ITEMS; do
            [ "$item" = "opencode.json" ] && continue  # Already handled
            [ -e "$TEMP_DIR/$item" ] && cp -r "$TEMP_DIR/$item" "$CONFIG_DIR/"
        done
    fi
    echo "==> Installation complete! Config is now independent of the repository."
else
    # Link mode - for debugging only
    echo "==> WARNING: Symlink mode is for debugging only. It may conflict with existing configs."
    if [ "$IS_GIT_REPO" = true ]; then
        echo "==> Creating symlinks..."
        # Handle opencode.json separately for merging in link mode
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            ln -sf "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Link other files (excluding ref/)
        for item in $INSTALL_ITEMS; do
            [ "$item" = "opencode.json" ] && continue  # Already handled
            [ -e "$REPO_DIR/$item" ] && ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    else
        echo "==> Cloning repository..."
        REPO_DIR="$HOME/opencode-config"
        if ! git clone --depth 1 https://github.com/huyusong10/opencode-config.git "$REPO_DIR" 2>/dev/null; then
            if [ -d "$REPO_DIR/.git" ]; then
                echo "==> Repository exists, updating..."
                cd "$REPO_DIR" && git pull || {
                    echo "==> ERROR: Failed to update repository."
                    exit 1
                }
                cd - > /dev/null
            else
                echo "==> ERROR: Failed to clone repository. Please check your network connection."
                exit 1
            fi
        fi
        # Handle opencode.json separately for merging in link mode
        if [ -f "$CONFIG_DIR/opencode.json" ] && [ -f "$REPO_DIR/opencode.json" ]; then
            echo "==> Merging opencode.json..."
            merge_opencode_json "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        else
            ln -sf "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
        fi
        # Link other files (excluding ref/)
        for item in $INSTALL_ITEMS; do
            [ "$item" = "opencode.json" ] && continue  # Already handled
            [ -e "$REPO_DIR/$item" ] && ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    fi
fi

echo "==> Installation complete!"