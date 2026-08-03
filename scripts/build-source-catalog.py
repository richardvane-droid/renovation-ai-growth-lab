#!/usr/bin/env python3
"""Build the complete AKKE original-file catalog from kb_entries metadata.

The input is a minimal Supabase export containing only document discovery
metadata. This script does not download originals or claim content-level
provenance. The three documents parsed by build-provenance-fixture.py are
marked separately as verified originals; every other row remains pending.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse


VERIFIED_IDS = {
    "91c87aff-19c5-45fa-916c-74524430e0d0",
    "99f537aa-df08-4cff-8932-24a27ca122c8",
    "2080854c-0238-46a5-a9c1-a91c47c9398a",
}


def original_filename(file_url: str, title: str) -> str:
    name = Path(unquote(urlparse(file_url).path)).name.strip()
    return name or title


def file_type(filename: str) -> str:
    suffix = Path(filename).suffix.lower().lstrip(".")
    return suffix or "unknown"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", default=Path("data/source-catalog.json"), type=Path)
    args = parser.parse_args()

    rows = json.loads(args.input.read_text(encoding="utf-8"))
    documents = []
    for row in rows:
        url = (row.get("file_url") or "").strip()
        if not url:
            continue
        filename = original_filename(url, row.get("title") or "未命名原件")
        status = "verified_original" if row["id"] in VERIFIED_IDS else "discovered_original"
        documents.append(
            {
                "id": row["id"],
                "title": row.get("title") or filename,
                "original_filename": filename,
                "file_url": url,
                "file_type": file_type(filename),
                "category": row.get("category") or "未分类",
                "source": row.get("source") or "未标注来源集",
                "source_type": row.get("type") or "doc",
                "source_updated_at": row.get("updated_at") or "",
                "import_status": status,
            }
        )

    documents.sort(
        key=lambda item: (
            item["import_status"] != "verified_original",
            item["category"],
            item["original_filename"],
        )
    )
    format_counts = Counter(item["file_type"] for item in documents)
    category_counts = Counter(item["category"] for item in documents)
    parsed = sum(item["import_status"] == "verified_original" for item in documents)

    output = {
        "catalog_version": "2026-08-03-v1",
        "scope": "public-kb-original-file-catalog",
        "source_table": "kb_entries",
        "summary": {
            "documents": len(documents),
            "parsed_documents": parsed,
            "pending_documents": len(documents) - parsed,
            "format_counts": dict(sorted(format_counts.items())),
            "category_counts": dict(category_counts.most_common()),
        },
        "documents": documents,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(documents)} originals: {parsed} parsed, "
        f"{len(documents) - parsed} pending -> {args.output}"
    )


if __name__ == "__main__":
    main()
