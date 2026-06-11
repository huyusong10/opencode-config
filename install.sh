#!/usr/bin/env bash
# coding-agent-config bootstrap installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/huyusong10/coding-agent-config/main/install.sh | bash
#   ./install.sh [codex|claude|opencode|all] [--profile full|--profile=full] [--link] [--dry-run]

set -euo pipefail

REPO_URL="${AGENTCFG_REPO_URL:-https://github.com/huyusong10/coding-agent-config.git}"
REPO_DIR="${AGENTCFG_REPO_DIR:-$HOME/coding-agent-config}"
TARGET="all"
PROFILE="full"
MODE="--copy"
DRY_RUN=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        codex|claude|opencode|all)
            TARGET="$1"
            ;;
        --profile)
            if [ "$#" -lt 2 ]; then
                echo "Missing value for --profile" >&2
                exit 2
            fi
            PROFILE="$2"
            shift
            ;;
        --profile=*)
            PROFILE="${1#--profile=}"
            if [ -z "$PROFILE" ]; then
                echo "Missing value for --profile" >&2
                exit 2
            fi
            ;;
        --link)
            MODE="--link"
            ;;
        --copy)
            MODE="--copy"
            ;;
        --dry-run)
            DRY_RUN="--dry-run"
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 2
            ;;
    esac
    shift
done

if [ -d "$REPO_DIR/.git" ]; then
    echo "==> Updating $REPO_DIR"
    git -C "$REPO_DIR" pull --rebase
else
    echo "==> Cloning $REPO_URL to $REPO_DIR"
    git clone --depth 1 "$REPO_URL" "$REPO_DIR"
fi

echo "==> Installing target=$TARGET profile=$PROFILE mode=$MODE"
"$REPO_DIR/bin/agentcfg" install "$TARGET" --profile "$PROFILE" "$MODE" $DRY_RUN
