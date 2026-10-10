#!/bin/sh
# F12 in the screenshot terminal (start.sh, tmux.conf).
#   shot.sh capture <pane>   the screen as it is now, with its colours, to $capture; then asks for a name
#   shot.sh save <name>      draws it as assets/images/screenshots/<name>.svg (ansi-svg.py)
here=$(cd "$(dirname "$0")" && pwd)
site=$(cd "$here/../../.." && pwd)
capture="${XDG_RUNTIME_DIR:-/tmp}/moonlapse-screenshot.ansi"
log="${XDG_RUNTIME_DIR:-/tmp}/moonlapse-screenshot.log"
t() { tmux -L moonlapse-screenshots "$@"; }

case "$1" in
capture)
    if ! t capture-pane -p -e -N -t "$2" > "$capture" 2>> "$log"; then
        t display-message "Couldn't capture the screen: see $log"
        exit 1
    fi
    t command-prompt -p "Save as (a kebab-case name; ESC to drop it):" "run-shell -b '\"$here/shot.sh\" save \"%%\"'"
    ;;
save)
    name=$(printf '%s' "$2" | sed 's/\.svg$//')
    case "$name" in
    ''|*[!a-z0-9-]*|-*)
        t display-message "Not saved: '$name' isn't a kebab-case name (fishing-at-morningside). F12 to try again."
        exit 1
        ;;
    esac
    out="$site/assets/images/screenshots/$name.svg"
    verb=Saved
    [ -e "$out" ] && verb=Replaced
    if python3 -I "$here/ansi-svg.py" "$capture" "$out" 2>> "$log"; then
        t display-message "$verb assets/images/screenshots/$name.svg"
    else
        t display-message "Not saved: see $log"
    fi
    ;;
esac
