"""Make smaller preview copies after Vite builds dist-pages.

Only files inside dist-pages/images may be replaced. public/images and the
lossless local archive are deliberately outside this script's writable scope.
The file format and name stay the same; PNG stays lossless, animation is kept,
and dimensions only change above 1600 px (apart from applying EXIF orientation).
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
import json
import os
import sys
import tempfile

try:
    from PIL import Image, ImageOps, JpegImagePlugin
except ImportError as exc:
    raise SystemExit(
        "Pages image optimization needs Pillow. Install the pinned version with: "
        "python -m pip install -r requirements-maintenance.txt"
    ) from exc


PROJECT = Path(__file__).resolve().parents[1]
SITE = PROJECT / "dist-pages"
IMAGES = SITE / "images"
MIN_BYTES = 100_000
MAX_SIDE = 1600
QUALITY = 82
TARGET_SITE_BYTES = 950_000_000
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def check_preview_paths():
    # Refuse symlink/junction redirects to public/images or an external archive.
    if not SITE.is_dir() or not IMAGES.is_dir():
        raise RuntimeError("Build dist-pages before optimizing its image copies.")
    if SITE.resolve() != SITE or IMAGES.resolve() != IMAGES:
        raise RuntimeError("dist-pages and dist-pages/images must be real build directories.")
    if IMAGES.samefile(PROJECT / "public" / "images"):
        raise RuntimeError("Refusing to optimize the original public image directory.")


def site_bytes():
    return sum(path.stat().st_size for path in SITE.rglob("*") if path.is_file())


def optimize(path):
    if path.is_symlink() or not path.resolve().is_relative_to(IMAGES):
        raise RuntimeError(f"Image resolves outside the Pages build: {path}")
    before = path.stat().st_size
    if before < MIN_BYTES:
        return {"saved": 0, "changed": 0, "resized": 0, "animated": 0}

    with Image.open(path) as original:
        fmt = original.format
        if fmt not in {"JPEG", "PNG", "WEBP"}:
            return {"saved": 0, "changed": 0, "resized": 0, "animated": 0}
        if getattr(original, "n_frames", 1) > 1:
            return {"saved": 0, "changed": 0, "resized": 0, "animated": 1}
        icc = original.info.get("icc_profile")
        sampling = JpegImagePlugin.get_sampling(original) if fmt == "JPEG" else -1
        pixels = ImageOps.exif_transpose(original)
        resized = max(pixels.size) > MAX_SIDE
        if resized:
            pixels.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

        options = {"icc_profile": icc} if icc else {}
        if fmt == "JPEG":
            if pixels.mode not in {"RGB", "L", "CMYK"}:
                pixels = pixels.convert("RGB")
            options.update(quality=QUALITY, optimize=True, progressive=True)
            if sampling in {0, 1, 2}:
                options["subsampling"] = sampling
        elif fmt == "PNG":
            # No palette quantization: text, illustrations and alpha stay intact.
            options.update(optimize=True, compress_level=9)
        else:
            options.update(quality=QUALITY, method=6)
        encoded = BytesIO()
        pixels.save(encoded, format=fmt, **options)
        payload = encoded.getvalue()

    if len(payload) >= before:
        return {"saved": 0, "changed": 0, "resized": 0, "animated": 0}

    # Replacing a sibling temporary file also avoids changing a shared inode if
    # a build system ever starts making hardlinked copies instead of Vite copies.
    temporary = None
    try:
        fd, filename = tempfile.mkstemp(prefix=".pages-image-", suffix=".tmp", dir=path.parent)
        temporary = Path(filename)
        with os.fdopen(fd, "wb") as handle:
            handle.write(payload)
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    return {"saved": before - len(payload), "changed": 1, "resized": int(resized), "animated": 0}


def main():
    check_preview_paths()
    before = site_bytes()
    candidates = sorted(
        path for path in IMAGES.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )
    totals = {"saved": 0, "changed": 0, "resized": 0, "animated": 0}
    with ThreadPoolExecutor(max_workers=min(4, os.cpu_count() or 1)) as executor:
        for result in executor.map(optimize, candidates):
            for key, value in result.items():
                totals[key] += value
    after = site_bytes()
    print(
        f"Pages image copies: {totals['changed']}/{len(candidates)} smaller; "
        f"saved {totals['saved'] / 1_000_000:.2f} MB; "
        f"{totals['resized']} resized, {totals['animated']} animations preserved.",
        flush=True,
    )
    print(json.dumps({
        "pagesImageOptimization": {
            "quality": QUALITY, "maxSide": MAX_SIDE, "minImageBytes": MIN_BYTES,
            "imagesScanned": len(candidates), "imagesChanged": totals["changed"],
            "savedBytes": totals["saved"], "siteBytesBefore": before,
            "siteBytesAfter": after, "siteTargetBytes": TARGET_SITE_BYTES,
        }
    }), flush=True)
    if after >= TARGET_SITE_BYTES:
        raise RuntimeError(
            f"Pages preview is {after / 1_000_000:.2f} MB after image optimization; "
            "it must remain below 950 MB. Original public images were not changed."
        )


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Pages image optimization failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
