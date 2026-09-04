from __future__ import annotations

import sys

from . import __version__


def main() -> None:
    if "--check" in sys.argv:
        import tkinter

        import Crypto
        import PIL
        import bs4
        import requests

        print(
            f"EHD Desktop {__version__}; Python OK; Tk {tkinter.TkVersion}; "
            f"requests {requests.__version__}; beautifulsoup4 {bs4.__version__}; "
            f"Pillow {PIL.__version__}; pycryptodome {Crypto.__version__}"
        )
        return

    from .app import run

    run(auto_start_queue="--resume-queue" in sys.argv)


if __name__ == "__main__":
    main()
