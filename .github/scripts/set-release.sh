#!/usr/bin/env bash
# Point data/release.toml at a release: set-release.sh <X.Y.Z> <YYYY-MM-DD>
# Edits version, date and available in place, keeping everything else. Prints "unchanged" and
# exits 0 if the file already points at that release.
set -euo pipefail

version=${1:?version}
date=${2:?date}
file=${RELEASE_TOML:-data/release.toml}

[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "not a version: $version" >&2; exit 1; }
[[ $date =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "not a date: $date" >&2; exit 1; }

# each key must appear exactly once, at the start of a line
for key in version date available; do
  n=$(grep -c "^$key = " "$file" || true)
  [[ $n == 1 ]] || { echo "$file: expected one '$key = ' line, found $n" >&2; exit 1; }
done

current=$(sed -n 's/^version = "\(.*\)"$/\1/p' "$file")
available=$(sed -n 's/^available = //p' "$file")

if [[ $current == "$version" && $available == true ]]; then
  echo unchanged
  exit 0
fi

# never move the site back to an older release
if [[ $available == true && $(printf '%s\n%s\n' "$current" "$version" | sort -V | tail -n1) != "$version" ]]; then
  echo "$file is on $current, newer than $version" >&2
  exit 1
fi

sed -i \
  -e "s/^version = .*/version = \"$version\"/" \
  -e "s/^date = .*/date = $date/" \
  -e "s/^available = .*/available = true/" \
  "$file"
echo updated
