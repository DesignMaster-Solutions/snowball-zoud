#!/bin/zsh
# Rebuilds CONCEPT.pdf and BUDGET.pdf from the .md files. These are the public links in the jam submission.
set -e
cd "${0:A:h}"
for doc in CONCEPT:"Snowball: game concept document" BUDGET:"Snowball: game budget"; do
  name=${doc%%:*}
  # gfm without math: every "$4k" in these documents is money.
  pandoc "$name.md" -f gfm-tex_math_dollars -t typst --template=pdf.typ -V pdftitle="${doc#*:}" -o ".$name.typ"
  sed -i '' 's/align(center)\[#table/align(left)[#table/' ".$name.typ" # pandoc centres every table cell
  typst compile ".$name.typ" "$name.pdf"
  rm ".$name.typ"
done
