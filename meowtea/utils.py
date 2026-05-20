from decimal import Decimal
from html import escape
from pathlib import Path
import re

from flask import current_app
from markupsafe import Markup


def decimal_to_number(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def format_currency(amount) -> str:
    value = int(amount or 0)
    return f"{value:,}".replace(",", ".") + "₫"


def render_stars(rating) -> str:
    rating = max(0, min(5, float(rating or 0)))
    full_stars = int(rating)
    has_half_star = rating - full_stars >= 0.5
    empty_stars = 5 - full_stars - (1 if has_half_star else 0)
    return ("★" * full_stars) + ("☆" if has_half_star else "") + ("☆" * empty_stars)


def get_full_name(ho: str | None, ten: str | None) -> str:
    return f"{ho or ''} {ten or ''}".strip()


def read_markdown_file(relative_path: str) -> str:
    if not relative_path:
        return ""
    full_path = Path(current_app.config["PROJECT_ROOT"]) / relative_path.replace("/", "\\")
    if not full_path.exists():
        return ""
    return full_path.read_text(encoding="utf-8")


def markdown_excerpt(markdown_content: str, length: int = 150) -> str:
    if not markdown_content:
        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
    text = re.sub(r"^#{1,6}\s+", "", markdown_content, flags=re.MULTILINE)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"\*\*([^\*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^\*]+)\*", r"\1", text)
    text = re.sub(r"^---$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= length:
        return text
    cut = text[:length]
    last_space = cut.rfind(" ")
    if last_space > -1:
        cut = cut[:last_space]
    return cut + "..."


def markdown_to_html(markdown_content: str) -> Markup:
    if not markdown_content:
        return Markup("")

    blocks = []
    list_items = []

    def flush_list():
        if list_items:
            blocks.append("<ul>" + "".join(f"<li>{item}</li>" for item in list_items) + "</ul>")
            list_items.clear()

    for raw_line in markdown_content.splitlines():
        line = raw_line.strip()
        if not line:
            flush_list()
            continue
        if line == "---":
            flush_list()
            blocks.append("<hr>")
            continue
        if line.startswith("- ") or line.startswith("* "):
            list_items.append(_render_markdown_inline(line[2:].strip()))
            continue

        flush_list()
        image_match = re.match(r"!\[([^\]]*)\]\(([^\)]+)\)", line)
        if image_match:
            alt = escape(image_match.group(1))
            src = escape(image_match.group(2), quote=True)
            blocks.append(f'<figure><img src="{src}" alt="{alt}"></figure>')
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            text = _render_markdown_inline(heading_match.group(2))
            blocks.append(f"<h{level}>{text}</h{level}>")
            continue

        blocks.append(f"<p>{_render_markdown_inline(line)}</p>")

    flush_list()
    return Markup("\n".join(blocks))


def _render_markdown_inline(text: str) -> str:
    rendered = escape(text)
    rendered = re.sub(r"\*\*([^\*]+)\*\*", r"<strong>\1</strong>", rendered)
    rendered = re.sub(r"\*([^\*]+)\*", r"<em>\1</em>", rendered)
    rendered = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r'<a href="\2">\1</a>', rendered)
    return rendered
