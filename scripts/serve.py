#!/usr/bin/env python3
"""Servidor local que imita o GitHub Pages: caminho desconhecido cai no 404.html.

Uso: python3 scripts/serve.py [porta]  ->  http://localhost:8000/github-timeline/<usuario>
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIX = "/github-timeline"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        if path.startswith(PREFIX):
            path = path[len(PREFIX):] or "/"
        return super().translate_path(path)

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        with open(os.path.join(ROOT, "404.html"), "rb") as f:
            body = f.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"http://localhost:{port}{PREFIX}/")
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
