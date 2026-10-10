#!/bin/sh
# Opens a terminal for taking screenshots of the game (README.md, beside this): foot at 123x38 in
# the game's colours, running tmux, where F12 saves the screen as assets/images/screenshots/<name>.svg.
#
#   .agents/scripts/screenshots/start.sh [directory]    # its shell starts there (the client's folder)
#
# Run it again to get back to the same session.
here=$(cd "$(dirname "$0")" && pwd)
dir=${1:-$PWD}
export MOONLAPSE_SCREENSHOTS="$here"
exec foot -c "$here/foot.ini" --window-size-chars=123x38 --title "Moonlapse screenshots" \
    tmux -L moonlapse-screenshots -f "$here/tmux.conf" new-session -A -s screenshots -c "$dir"
