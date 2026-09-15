"""Start the static site, falling back when Windows reserves the preferred port."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


def create_server(port=8000):
    public = Path(__file__).resolve().parent.parent / "public"
    handler = partial(SimpleHTTPRequestHandler, directory=str(public))
    try:
        return ThreadingHTTPServer(("", port), handler)
    except OSError as error:
        # Only retry port access/conflict failures, not unrelated startup errors.
        if error.errno not in (13, 48, 98, 10013, 10048) and getattr(error, "winerror", None) not in (10013, 10048):
            raise
        return ThreadingHTTPServer(("", 0), handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    with create_server(args.port) as server:
        url = f"http://localhost:{server.server_port}/"
        print(f"URL: {url}", flush=True)
        print("Stop / 停止: Ctrl+C", flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
