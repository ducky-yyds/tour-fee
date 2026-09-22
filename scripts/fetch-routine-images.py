"""Download explicitly licensed Wikimedia photographs for itinerary scene references.

Run with Python 3; uses only the standard library. No image processing or generation.
Existing destination photographs and their manifest are never changed.
"""
import concurrent.futures
import datetime
import html
import json
import pathlib
import re
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
USER_AGENT = "TusuanTravelPlanner/1.0 (Wikimedia Commons scene references; credits retained)"
SOURCES = {
    "breakfast": ("Coffee-morning-breakfast-croissant (24300690486).jpg", "咖啡与可颂早餐场景", "咖啡与可颂；不代表目的地实际早餐或所含套餐。"),
    "meal": ("Foods on table.jpg", "餐桌与菜肴场景", "印度尼西亚餐桌摄影；不代表当地餐馆、实际菜品或所含份量。"),
    "air": ("Airplane wing sky and clouds.jpg", "机翼与云层场景", "从机舱窗口看到的机翼；不代表实际航司、航班或执飞机型。"),
    "transfer": ("Airport e-Shuttle bus (Roma Ciampino Airport) in 2026.02.jpg", "机场接驳巴士场景", "罗马钱皮诺机场接驳巴士；仅参考交通场景，不代表目的地接驳运营商或车型。"),
    "rail": ("N700 Shinkansen Nozomi.jpg", "站台上的高速列车", "日本 N700 新干线列车；不代表所选路线、车次或实际车型。"),
    "boat": ("Sydney Ferry Narrabeen travelling to Manly on Sydney Harbour (cropped).jpg", "海面上的客运渡轮", "悉尼 Narrabeen 渡轮；不代表所选船程、运营商或船型。"),
    "hotel": ("Hotel room interior at hotel Radisson Blu Oulu.jpg", "酒店客房与床铺场景", "芬兰奥卢 Radisson Blu 酒店客房；仅作住宿场景参考，不代表已选择或已预订酒店、房型及设施。"),
}


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


def plain(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value or ""))).strip()


def main():
    query = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata",
        "iiurlwidth": 960, "titles": "|".join("File:" + row[0] for row in SOURCES.values()), "redirects": "1",
    })
    result = json.loads(get("https://commons.wikimedia.org/w/api.php?" + query))
    pages = {page["title"].removeprefix("File:").replace("_", " "): page["imageinfo"][0]
             for page in result.get("query", {}).get("pages", {}).values() if page.get("imageinfo")}
    checked_at = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    output = ROOT / "public" / "images"
    output.mkdir(parents=True, exist_ok=True)

    def download(entry):
        key, (file_title, alt, description) = entry
        info = pages[file_title.replace("_", " ")]
        metadata = info["extmetadata"]
        license_name = plain(metadata.get("LicenseShortName", {}).get("value"))
        if not re.fullmatch(r"CC BY(?:-SA)? (?:1\.0|2\.[05]|3\.0|4\.0)|CC0|Public domain", license_name):
            raise ValueError(f"Unsupported or unverified license: {file_title}: {license_name}")
        remote = info.get("thumburl") or info["url"]
        content = get(remote)
        if not content.startswith(b"\xff\xd8\xff") or len(content) > 700 * 1024:
            raise ValueError(f"Not a suitable JPEG thumbnail: {file_title} ({len(content)} bytes)")
        filename = "routine-" + key + ".jpg"
        record = {
            "url": "/images/" + filename, "alt": alt, "credit": plain(metadata.get("Artist", {}).get("value")),
            "sourceUrl": info["descriptionurl"], "license": license_name,
            "licenseUrl": metadata.get("LicenseUrl", {}).get("value") or "https://creativecommons.org/publicdomain/zero/1.0/",
            "fileTitle": file_title, "description": description,
            "capturedAt": plain(metadata.get("DateTimeOriginal", {}).get("value")),
            "checkedAt": checked_at, "remoteUrl": remote,
            "width": info.get("thumbwidth", info.get("width")), "height": info.get("thumbheight", info.get("height")),
            "bytes": len(content), "isReference": True, "referenceLabel": "场景参考图",
            "modifications": "Wikimedia thumbnail; interface may crop the image to fit. Original photo license retained.",
        }
        if not record["credit"]:
            raise ValueError(f"Author missing: {file_title}")
        return key, record, content

    # Validate all downloads before replacing the published manifest or photographs.
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        downloaded = list(pool.map(download, SOURCES.items()))
    records = {}
    for key, record, content in downloaded:
        target = output / pathlib.Path(record["url"]).name
        temporary = target.with_suffix(".jpg.tmp")
        temporary.write_bytes(content)
        temporary.replace(target)
        records[key] = record
        print(f"{key}: {record['license']}; {record['bytes']} bytes")
    manifest = ROOT / "data" / "routine-media.json"
    temporary = manifest.with_suffix(".json.tmp")
    temporary.write_text(json.dumps({"version": 1, "checkedAt": checked_at, "images": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(manifest)


if __name__ == "__main__":
    main()
