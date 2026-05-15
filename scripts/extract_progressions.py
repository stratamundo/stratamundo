"""Extract text from the Fractions Progressions PDF, one page per file under docs/research/_progressions_pages/."""
import os
from pypdf import PdfReader

PDF = r"C:/projects/stratamundo/docs/research/Progressions-3-5-Fractions.pdf"
OUT = r"C:/projects/stratamundo/docs/research/_progressions_pages"
os.makedirs(OUT, exist_ok=True)

reader = PdfReader(PDF)
print(f"Total pages: {len(reader.pages)}")
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    with open(os.path.join(OUT, f"page-{i:03d}.txt"), "w", encoding="utf-8") as f:
        f.write(text)
print("Done.")
