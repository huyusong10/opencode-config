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
#
# Migration: This script migrates opencode.json to opencode.jsonc (JSON with Comments)

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

# Backup existing config (keep config files for merging)
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
    # Backup config files (copy, not move — keeps them in place for merging)
    for cfg in opencode.jsonc opencode.json; do
        if [ -f "$CONFIG_DIR/$cfg" ]; then
            cp "$CONFIG_DIR/$cfg" "$BACKUP/$cfg" 2>/dev/null || true
        fi
    done
fi

mkdir -p "$CONFIG_DIR" || {
    echo "==> ERROR: Cannot create config directory '$CONFIG_DIR'. Permission denied?"
    exit 1
}

# Function to find existing config file (returns path or empty)
find_existing_config() {
    local dir="$1"
    if [ -f "$dir/opencode.jsonc" ]; then
        echo "$dir/opencode.jsonc"
    elif [ -f "$dir/opencode.json" ]; then
        echo "$dir/opencode.json"
    fi
}

# Function to merge opencode config files
# Supports both JSON and JSONC formats, outputs JSONC
merge_opencode_config() {
    local source_file="$1"      # Our config (opencode.jsonc)
    local target_dir="$2"       # User's config directory
    local output_file="$target_dir/opencode.jsonc"
    
    # Try Python merge (preferred)
    if command -v python3 &>/dev/null; then
        # Create temp Python script
        PY_MERGE_SCRIPT=$(mktemp)
        cat > "$PY_MERGE_SCRIPT" << 'PYEOF'
import json
import re
import sys
import os

def strip_jsonc_comments(content):
    """Remove // and /* */ comments from JSONC content."""
    # Remove single-line comments (// ...)
    # Be careful not to remove // inside strings
    result = []
    i = 0
    in_string = False
    string_char = None
    
    while i < len(content):
        char = content[i]
        
        # Handle string boundaries
        if not in_string and char in '"\'':
            in_string = True
            string_char = char
            result.append(char)
            i += 1
        elif in_string:
            if char == '\\' and i + 1 < len(content):
                # Escape sequence, append both chars
                result.append(char)
                result.append(content[i + 1])
                i += 2
            elif char == string_char:
                in_string = False
                string_char = None
                result.append(char)
                i += 1
            else:
                result.append(char)
                i += 1
        # Handle // comments
        elif char == '/' and i + 1 < len(content) and content[i + 1] == '/':
            # Skip until end of line
            while i < len(content) and content[i] != '\n':
                i += 1
        # Handle /* */ comments
        elif char == '/' and i + 1 < len(content) and content[i + 1] == '*':
            i += 2
            while i < len(content):
                if content[i] == '*' and i + 1 < len(content) and content[i + 1] == '/':
                    i += 2
                    break
                i += 1
        else:
            result.append(char)
            i += 1
    
    return ''.join(result)

def parse_jsonc_file(filepath):
    """Parse a JSON or JSONC file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try parsing as-is first (might be valid JSON)
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    
    # Strip comments and try again
    try:
        stripped = strip_jsonc_comments(content)
        return json.loads(stripped)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON/JSONC in {filepath}: {e}")

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
                if isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value, f"{path}.{key}")
                else:
                    result[key] = value
            elif key == "permission":
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
                if isinstance(result[key], list) and isinstance(value, list):
                    existing = set(result[key])
                    for item in value:
                        if item not in existing:
                            result[key].append(item)
                else:
                    result[key] = value
            elif key == "instructions":
                if isinstance(result[key], list) and isinstance(value, list):
                    existing = set(result[key])
                    for item in value:
                        if item not in existing:
                            result[key].append(item)
                else:
                    result[key] = value
            else:
                result[key] = value
        else:
            result[key] = value
    
    return result

source_file = sys.argv[1]
target_dir = sys.argv[2]
output_file = sys.argv[3]

# Find existing config file (prefer opencode.jsonc over opencode.json)
existing_config = None
existing_jsonc = os.path.join(target_dir, "opencode.jsonc")
existing_json = os.path.join(target_dir, "opencode.json")

if os.path.exists(existing_jsonc):
    existing_config = existing_jsonc
    has_old_json = False
elif os.path.exists(existing_json):
    existing_config = existing_json
    has_old_json = True
else:
    has_old_json = False

# Parse source file (our config)
try:
    source = parse_jsonc_file(source_file)
except Exception as e:
    print(f"ERROR: Failed to parse source config: {e}")
    sys.exit(1)

# Merge or use source directly
if existing_config:
    try:
        target = parse_jsonc_file(existing_config)
        merged = deep_merge(target, source)
        print(f"Merged config from {existing_config}")
    except Exception as e:
        print(f"WARNING: Failed to parse existing config, using source: {e}")
        merged = source
else:
    merged = source

# Write output as JSONC (just JSON for now, comments are preserved from source logic)
try:
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"Config saved to {output_file}")
except IOError as e:
    print(f"ERROR: Failed to write config: {e}")
    sys.exit(1)

# Remove old opencode.json if it existed (migration to JSONC)
if has_old_json and os.path.exists(existing_json):
    try:
        os.remove(existing_json)
        print(f"Removed old {existing_json} (migrated to JSONC)")
    except Exception as e:
        print(f"WARNING: Failed to remove old opencode.json: {e}")
PYEOF
        
        # Execute the merge script
        python3 "$PY_MERGE_SCRIPT" "$source_file" "$target_dir" "$output_file"
        rm -f "$PY_MERGE_SCRIPT"
        return $?
    fi
    
    # Fallback: try jq if available (won't handle JSONC comments)
    if command -v jq &>/dev/null; then
        local existing_config
        existing_config=$(find_existing_config "$target_dir")
        
        if [ -n "$existing_config" ]; then
            echo "==> WARNING: jq cannot parse JSONC comments, using simple merge"
            local tmp_file
            tmp_file=$(mktemp)
            # Try to use a simple approach - just copy our config
            # jq will fail on JSONC, so we copy directly
            if jq '.' "$source_file" >/dev/null 2>&1; then
                # Source is valid JSON (no comments or already stripped)
                if jq '.' "$existing_config" >/dev/null 2>&1; then
                    # Both are valid JSON
                    if jq -s '.[0] * .[1]' "$existing_config" "$source_file" > "$tmp_file" 2>/dev/null; then
                        mv "$tmp_file" "$target_dir/opencode.jsonc"
                        echo "Merged config saved to $target_dir/opencode.jsonc (using jq)"
                        # Remove old opencode.json if exists
                        [ -f "$target_dir/opencode.json" ] && rm -f "$target_dir/opencode.json"
                        return 0
                    fi
                fi
            fi
        fi
        # Fallback: just copy
        echo "==> WARNING: jq merge failed, copying config directly"
        cp "$source_file" "$target_dir/opencode.jsonc"
        [ -f "$target_dir/opencode.json" ] && rm -f "$target_dir/opencode.json"
        return 0
    fi
    
    # Last resort: just copy (warn user)
    echo "WARNING: Neither python3 nor jq found, copying config as-is."
    cp "$source_file" "$target_dir/opencode.jsonc"
    [ -f "$target_dir/opencode.json" ] && rm -f "$target_dir/opencode.json"
}

# Files and directories to install (excluding ref/, .planning/, .worktrees/, caches, etc.)
INSTALL_ITEMS="AGENTS.md agent command plugin skills tui.json rules scripts"

# Install
if [ "$MODE" = "copy" ]; then
    echo "==> Copying files..."
    if [ "$IS_GIT_REPO" = true ]; then
        # Handle opencode.jsonc separately for merging
        if [ -f "$REPO_DIR/opencode.jsonc" ]; then
            echo "==> Processing opencode.jsonc..."
            merge_opencode_config "$REPO_DIR/opencode.jsonc" "$CONFIG_DIR"
        fi
        # Copy other files
        for item in $INSTALL_ITEMS; do
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
        # Handle opencode.jsonc separately for merging
        if [ -f "$TEMP_DIR/opencode.jsonc" ]; then
            echo "==> Processing opencode.jsonc..."
            merge_opencode_config "$TEMP_DIR/opencode.jsonc" "$CONFIG_DIR"
        fi
        # Copy other files
        for item in $INSTALL_ITEMS; do
            [ -e "$TEMP_DIR/$item" ] && cp -r "$TEMP_DIR/$item" "$CONFIG_DIR/"
        done
    fi
    echo "==> Installation complete! Config is now independent of the repository."
else
    # Link mode - for debugging only
    echo "==> WARNING: Symlink mode is for debugging only. It may conflict with existing configs."
    if [ "$IS_GIT_REPO" = true ]; then
        echo "==> Creating symlinks..."
        # Remove existing config files before linking
        for cfg in opencode.jsonc opencode.json; do
            [ -f "$CONFIG_DIR/$cfg" ] && rm -f "$CONFIG_DIR/$cfg"
        done
        # Create symlink for opencode.jsonc
        if [ -f "$REPO_DIR/opencode.jsonc" ]; then
            ln -sf "$REPO_DIR/opencode.jsonc" "$CONFIG_DIR/opencode.jsonc"
        fi
        # Link other files (ln -sf handles existing files/symlinks)
        for item in $INSTALL_ITEMS; do
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
        # Remove existing config files before linking
        for cfg in opencode.jsonc opencode.json; do
            [ -f "$CONFIG_DIR/$cfg" ] && rm -f "$CONFIG_DIR/$cfg"
        done
        # Create symlink for opencode.jsonc
        if [ -f "$REPO_DIR/opencode.jsonc" ]; then
            ln -sf "$REPO_DIR/opencode.jsonc" "$CONFIG_DIR/opencode.jsonc"
        fi
        # Link other files (ln -sf handles existing files/symlinks)
        for item in $INSTALL_ITEMS; do
            [ -e "$REPO_DIR/$item" ] && ln -sf "$REPO_DIR/$item" "$CONFIG_DIR/$item"
        done
        echo "==> Done! Run 'cd $REPO_DIR && git pull' to update."
    fi
fi

echo "==> Installation complete!"