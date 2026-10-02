#!/usr/bin/env python3
"""Bundle src/ into the two files of the Google Apps Script project:
   apps-script/Code.gs         - server (Sheet storage, Drive saves, optional Claude helper)
   apps-script/Interface.html  - the whole page (styles, content, scripts); also opens offline in a browser
"""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = Path(os.environ.get("CC_DIST", ROOT))
DATA = Path(os.environ.get("CC_DATA_DIR", SRC / "data"))


def read(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def data_js() -> str:
    files = sorted(DATA.glob("*.js"))
    body = "\n".join(f.read_text(encoding="utf-8") for f in files)
    return body + "\nwindow.CC_DATA = Object.assign({}, window.CC_DATA_PARTS);\n"


def body() -> str:
    html = read("shell.html")
    parts = {
        "/*@@CSS@@*/": read("styles.css"),
        "/*@@DATA@@*/": data_js(),
        "/*@@DOCX@@*/": read("docx.js"),
        "/*@@CORE@@*/": read("core.js"),
        "/*@@CV@@*/": read("cv.js"),
        "/*@@APP@@*/": read("app.js"),
    }
    for marker, content in parts.items():
        assert marker in html, marker
        assert "</script" not in content.lower(), f"{marker} contains </script"
        html = html.replace(marker, content)
    return html


HEAD = """<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""


def main() -> None:
    out = DIST / "apps-script"
    out.mkdir(parents=True, exist_ok=True)
    page = HEAD + body() + "\n</body>\n</html>\n"
    (out / "Interface.html").write_text(page, encoding="utf-8")
    shutil.copyfile(SRC / "apps-script" / "Code.gs", out / "Code.gs")
    print(f"Interface.html {len(page.encode()) // 1024} KB, Code.gs {(out / 'Code.gs').stat().st_size // 1024} KB -> {out}")


if __name__ == "__main__":
    main()
