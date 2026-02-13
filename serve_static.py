#!/usr/bin/env python3
"""Simple static file server for SPA with correct MIME types."""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist", "public")

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    
    def do_GET(self):
        # If the file doesn't exist and it's not an asset, serve index.html (SPA routing)
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith('/assets/'):
            self.path = '/index.html'
        return super().do_GET()
    
    def guess_type(self, path):
        """Override to ensure correct MIME types."""
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        if path.endswith('.json'):
            return 'application/json'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        if path.endswith('.woff2'):
            return 'font/woff2'
        if path.endswith('.woff'):
            return 'font/woff'
        return super().guess_type(path)

if __name__ == '__main__':
    with http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler) as httpd:
        print(f"Serving {DIST_DIR} on http://localhost:{PORT}/")
        httpd.serve_forever()
