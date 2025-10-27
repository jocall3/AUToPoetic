#!/bin/bash
# Script to remove invalid external dependencies (leaves workspace deps intact)

echo "Cleaning invalid external dependencies..."

for SECTION in dependencies devDependencies; do
  if jq -e ".${SECTION}" package.json > /dev/null; then
    for PKG in $(jq -r ".${SECTION} | keys[]" package.json); do
      # Skip workspace packages
      if jq -e ".${SECTION}[\"$PKG\"]" package.json | grep -q '"workspace:'; then
        continue
      fi

      # Check if package exists on npm
      if ! npm view "$PKG" >/dev/null 2>&1; then
        echo "Removing invalid package: $PKG from $SECTION"
        TMP_FILE="package.json.tmp"
        jq "del(.${SECTION}[\"$PKG\"])" package.json > $TMP_FILE
        mv $TMP_FILE package.json
      fi
    done
  fi
done

echo "Finished cleaning external dependencies."
