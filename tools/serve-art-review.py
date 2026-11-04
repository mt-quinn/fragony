"""Local art review with fresh modules/archives on every reload."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=43215);args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def end_headers(self):
  self.send_header('Cache-Control','no-store');super().end_headers()
 def log_message(self,*a):pass
print(f'http://127.0.0.1:{args.port}/research/map-color-preview/',flush=True)
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
