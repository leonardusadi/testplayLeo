#!/usr/bin/env python3
"""Bundle src/ into two single-file outputs:
   dist/index.html            - artifact body (the claude.ai publisher adds the document skeleton)
   dist/career-compass.html   - standalone page that opens offline in any browser
"""
import os
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = Path(os.environ.get("CC_DIST", ROOT / "dist"))
DATA = Path(os.environ.get("CC_DATA_DIR", SRC / "data"))


def read(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def data_js() -> str:
    files = sorted(DATA.glob("*.js"))
    body = "\n".join(f.read_text(encoding="utf-8") for f in files)
    return body + "\nwindow.CC_DATA = Object.assign({}, window.CC_DATA_PARTS);\n"


def bundle() -> str:
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
        assert "</script" not in content.lower() or marker == "/*@@CSS@@*/", f"{marker} contains </script"
        html = html.replace(marker, content)
    return html


STANDALONE_HEAD = """<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""


def main() -> None:
    DIST.mkdir(exist_ok=True)
    body = bundle()
    (DIST / "index.html").write_text(body, encoding="utf-8")
    (DIST / "career-compass.html").write_text(STANDALONE_HEAD + body + "\n</body>\n</html>\n", encoding="utf-8")
    print(f"index.html {len(body.encode()) // 1024} KB; career-compass.html written")


if __name__ == "__main__":
    main()
