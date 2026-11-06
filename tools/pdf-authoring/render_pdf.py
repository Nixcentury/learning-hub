"""The single offline PDF renderer. No browser, remote fonts or alternate layouts."""
import json
import logging
import sys
import io
import re
from collections import defaultdict
from pathlib import Path

import pypdf
import weasyprint
from weasyprint import HTML, default_url_fetcher

HERE = Path(__file__).resolve().parent
lock = json.loads((HERE / 'template.lock.json').read_text())
if weasyprint.__version__ != lock['weasyprintVersion']:
    raise RuntimeError(f"Use WeasyPrint {lock['weasyprintVersion']}; found {weasyprint.__version__}")
if pypdf.__version__ != lock['pypdfVersion']:
    raise RuntimeError(f"Use pypdf {lock['pypdfVersion']}; found {pypdf.__version__}")

class Problems(logging.Handler):
    def __init__(self):
        super().__init__(logging.WARNING)
        self.messages = []
    def emit(self, record):
        self.messages.append(record.getMessage())

problems = Problems()
logging.getLogger('weasyprint').addHandler(problems)

def embedded_only(url, *args, **kwargs):
    if not url.startswith('data:'):
        raise ValueError('Only embedded fonts and images are allowed.')
    return default_url_fetcher(url, *args, **kwargs)

source, target = sys.argv[1:]
document = HTML(filename=source, url_fetcher=embedded_only).render()
# Geometry is CSS px. Content and running labels must stay in the same 180 mm width.
left, right = 15 * 96 / 25.4, 195 * 96 / 25.4
question_pages = defaultdict(set)
keep_pages = defaultdict(set)
for number, page in enumerate(document.pages, 1):
    assert abs(page.width - 210 * 96 / 25.4) < 0.1
    assert abs(page.height - 297 * 96 / 25.4) < 0.1
    for box in page._page_box.descendants():
        element = getattr(box, 'element', None)
        if element is not None and element.get('data-print-keep') is not None:
            keep_pages[id(element)].add(number)
        if element is not None and element.get('data-pdf-question'):
            question_pages[element.get('data-pdf-question')].add(number)
        if type(box).__name__ == 'TableCellBox' and element is not None and element.tag == 'span':
            for line in box.children:
                if line.width > box.width + 1:
                    raise RuntimeError(f'Header/footer label is too long on page {number}. Shorten metadata; never shrink its font.')
        if type(box).__name__ in ('TextBox', 'InlineReplacedBox', 'BlockReplacedBox'):
            x = box.position_x
            if x < left - 1 or x + box.width > right + 1:
                raise RuntimeError(f'Content is wider than the master on page {number}. Split the content; do not shrink fonts.')
            if box.position_y < 0 or box.position_y + box.height > page.height + 1:
                raise RuntimeError(f'Content runs off page {number}.')
for question, pages in question_pages.items():
    if len(pages) > 1:
        raise RuntimeError(f'{question} is too tall for one page. Divide it into meaningful questions.')
if any(len(pages) > 1 for pages in keep_pages.values()):
    raise RuntimeError('A data-print-keep block is taller than a page. Split it meaningfully.')
if problems.messages:
    raise RuntimeError('\n'.join(problems.messages))
pdf_bytes = document.write_pdf()
reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
assert len(reader.pages) == len(document.pages)
for page in reader.pages:
    assert abs(float(page.mediabox.width) - 210 * 72 / 25.4) < 0.1
    assert abs(float(page.mediabox.height) - 297 * 72 / 25.4) < 0.1
    assert 'Nix-century' in page.extract_text()
    for reference in page['/Resources'].get('/Font', {}).values():
        font = reference.get_object()
        if not re.fullmatch(r'[A-Z]{6}\+Hub-PDF-(Thai|Latin)(-Bold)?', str(font.get('/BaseFont', '')).lstrip('/')):
            raise RuntimeError(f"Unapproved fallback font {font.get('/BaseFont')}. Use supported text or a MathJax equation.")
Path(target).write_bytes(pdf_bytes)
print(json.dumps({'pages':len(reader.pages), 'engine':{'weasyprint':weasyprint.__version__, 'mathjax':'3.2.2', 'pypdf':pypdf.__version__}}))
