#!/usr/bin/env python3
"""Inline external CSS and JS assets into index.html for single-request loading."""
import re
import os

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist", "public")
HTML_PATH = os.path.join(DIST_DIR, "index.html")
OUTPUT_PATH = os.path.join(DIST_DIR, "inline.html")

with open(HTML_PATH, 'r') as f:
    html = f.read()

# Inline CSS: <link rel="stylesheet" crossorigin href="/assets/xxx.css">
def inline_css(match):
    href = match.group(1)
    css_path = os.path.join(DIST_DIR, href.lstrip('/'))
    if os.path.exists(css_path):
        with open(css_path, 'r') as f:
            css = f.read()
        return f'<style>{css}</style>'
    return match.group(0)

html = re.sub(r'<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+)">', inline_css, html)

# Inline JS: <script type="module" crossorigin src="/assets/xxx.js"></script>
def inline_js(match):
    src = match.group(1)
    js_path = os.path.join(DIST_DIR, src.lstrip('/'))
    if os.path.exists(js_path):
        with open(js_path, 'r') as f:
            js = f.read()
        # Remove dynamic imports that reference external chunks - they'll fail anyway
        return f'<script type="module">{js}</script>'
    return match.group(0)

html = re.sub(r'<script\s+type="module"\s+crossorigin\s+src="([^"]+)"></script>', inline_js, html)

with open(OUTPUT_PATH, 'w') as f:
    f.write(html)

size_kb = os.path.getsize(OUTPUT_PATH) / 1024
print(f"Created {OUTPUT_PATH} ({size_kb:.0f} KB)")
