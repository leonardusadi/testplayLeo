#!/usr/bin/env python3
"""Bundle src/ into the two files of the Google Apps Script project:
   apps-script/Code.gs         - server (Sheet storage, Drive saves, optional Claude helper)
   apps-script/Interface.html  - the whole page (styles, content, scripts); also opens offline in a browser
"""
import hashlib
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


def ascii_js(text: str) -> str:
    """Write every non-ASCII character as a \\u escape so copy-paste and encodings cannot damage it."""
    out = []
    for ch in text:
        code = ord(ch)
        if code < 128:
            out.append(ch)
        elif code <= 0xFFFF:
            out.append("\\u%04x" % code)
        else:
            code -= 0x10000
            out.append("\\u%04x\\u%04x" % (0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF)))
    return "".join(out)


def bundle_js() -> str:
    """All scripts in one function scope: no global names that could clash with code Google adds to the page."""
    parts = [data_js(), read("docx.js"), read("core.js"), read("cv.js"), read("app.js")]
    for part in parts:
        assert "</script" not in part.lower(), "a script contains </script"
    return "(function () {\n" + "\n;\n".join(parts) + "\nwindow.__ccLoaded = true;\n})();"


def body() -> tuple[str, str]:
    js = ascii_js(bundle_js())
    version = hashlib.sha1(js.encode()).hexdigest()[:7]
    html = read("shell.html")
    for marker, content in {"/*@@CSS@@*/": read("styles.css"), "/*@@BUNDLE@@*/": js, "/*@@VERSION@@*/": version}.items():
        assert marker in html, marker
        html = html.replace(marker, content)
    assert all(ord(c) < 128 for c in html), "non-ASCII left in the page"
    return html, version


HEAD = """<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
<script>
/* Start-up watchdog: if the app cannot start, say so on screen instead of showing an empty page. */
(function () {
  var errs = [];
  function show() {
    if (window.__ccStarted) return;
    var box = document.getElementById('cc-fail');
    if (!box) return;
    box.hidden = false;
    var d = document.getElementById('cc-fail-detail');
    if (d) d.textContent = errs.length ? errs.join(' | ') : 'No error message was reported.';
  }
  window.__ccFail = function (err) { errs.push(String((err && err.message) || err)); show(); };
  window.addEventListener('error', function (e) { errs.push((e.message || 'Script error') + (e.lineno ? ' (line ' + e.lineno + ')' : '')); show(); });
  setTimeout(function () {
    if (window.__ccStarted) return;
    if (!window.__ccLoaded) errs.push('The end of the page file did not load, so it was probably cut off when it was copied.');
    show();
  }, 4000);
})();
</script>
</head>
<body>
"""


def main() -> None:
    out = DIST / "apps-script"
    out.mkdir(parents=True, exist_ok=True)
    page_body, version = body()
    page = HEAD + page_body + "\n</body>\n</html>\n"
    (out / "Interface.html").write_text(page, encoding="utf-8")
    shutil.copyfile(SRC / "apps-script" / "Code.gs", out / "Code.gs")
    print(f"Interface.html {len(page.encode()) // 1024} KB, {page.count(chr(10)) + 1} lines, version {version}; Code.gs {(out / 'Code.gs').stat().st_size // 1024} KB -> {out}")


if __name__ == "__main__":
    main()
