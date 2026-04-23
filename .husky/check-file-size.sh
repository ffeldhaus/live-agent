#!/bin/bash

MAX_LINES=1200
FAILED=0

while IFS= read -r -d '' file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -ge "$MAX_LINES" ]; then
        echo "Error: $file has $lines lines (limit is $MAX_LINES)"
        FAILED=1
    fi
done < <(find . -type f \( -name "*.ts" -o -name "*.css" -o -name "*.html" \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/coverage/*' -print0)

if [ "$FAILED" -ne 0 ]; then
    echo "File size check failed."
    exit 1
fi
