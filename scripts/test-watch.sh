#!/bin/bash

# Check if directory argument is provided, default to current directory
DIR="${1:-.}"
TIMESTAMP_FILE="/tmp/mafia_watch_timestamp"

# Initialize timestamp file
touch "$TIMESTAMP_FILE"

echo "👀 Watching for changes in $DIR..."
echo "Press Ctrl+C to stop."

while true; do
  # Find .go files changed since the last check
  # We use a temp file to track the last time we ran tests
  changed_files=$(find "$DIR" -name "*.go" -newer "$TIMESTAMP_FILE")

  if [ -n "$changed_files" ]; then
    # Update timestamp immediately to capture subsequent changes
    touch "$TIMESTAMP_FILE"
    
    echo -e "\n🔄 Detected changes in:"
    echo "$changed_files" | sed 's/^/  - /'
    
    # Get unique directories (packages) from changed files
    # We assume standard Go layout where files in the same folder are in the same package
    packages=$(echo "$changed_files" | xargs -n1 dirname | sort | uniq)
    
    for pkg in $packages; do
      echo -e "\n📦 \033[1mTesting package: $pkg\033[0m"
      echo "---------------------------------------------------"
      
      # Run test with -v to show each test case
      # We trim the ./ prefix for cleaner output, though go test accepts it
      if ! go test -v "$pkg"; then
         echo -e "\n❌ \033[31mTests failed in $pkg\033[0m"
      else
         echo -e "\n✅ \033[32mTests passed in $pkg\033[0m"
      fi
    done
    echo "---------------------------------------------------"
    echo "👀 Watching..."
  fi
  
  sleep 1
done