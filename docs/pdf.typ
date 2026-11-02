// Pandoc template for the jam PDFs (see pdf.sh): the text comes from the .md, so the repo and the PDF say the same thing.
#let horizontalrule = line(length: 100%, stroke: 0.5pt + rgb("#c9d6e2"))
#set document(title: "$pdftitle$", author: "Design Master Solutions LLC")
#set page(paper: "a4", margin: (x: 2cm, top: 1.7cm, bottom: 1.9cm), footer: context [
  #set text(size: 7.5pt, fill: rgb("#5b6b7a"))
  Design Master Solutions LLC · info\@designmastersolutions.com · WhatsApp +1 (617) 275-3254 · www.designmastersolutions.com
  #h(1fr) #counter(page).display("1 / 1", both: true)
])
#set text(font: ("Avenir Next", "Geeza Pro"), size: 10pt, fill: rgb("#18324a"), lang: "en")
#set par(leading: 0.6em, spacing: 0.85em)
#show heading.where(level: 1): set text(size: 30pt, weight: "bold")
#show heading.where(level: 1): set block(above: 0pt, below: 0.5em)
#show heading.where(level: 2): it => block(above: 1.3em, below: 0.7em, width: 100%, inset: (bottom: 3pt), stroke: (bottom: 1.5pt + rgb("#ffd166")), text(size: 13.5pt, weight: "bold", it.body))
#show heading.where(level: 3): set text(size: 10pt, weight: "bold")
#show heading.where(level: 3): set block(above: 1em, below: 0.6em)
#show link: set text(fill: rgb("#006DA9"))
#show raw: set text(font: "Menlo", size: 8.5pt)
#set table(stroke: (x: none, y: 0.4pt + rgb("#c9d6e2")), inset: (x: 5pt, y: 4pt))
#show table: set text(size: 9pt)
#show table: set par(leading: 0.5em)
#show image: set image(width: 100%)
#place(top + right, dy: 2pt, image("shots/dms-logo.svg", width: 3.6cm))
$body$
