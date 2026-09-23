"""Publish a subject-specific imagegen illustration as a compact card asset.

Only encodes/resizes an already generated asset; never generates or retouches
pixels. The input stays intact. Prompts and AI provenance are kept in a pack.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id', required=True)
    parser.add_argument('--source', required=True)
    parser.add_argument('--prompt-file', required=True)
    args = parser.parse_args()
    foods = {f['id']: f for f in json.loads((ROOT/'data/local-foods.json').read_text('utf-8-sig'))}
    if args.id not in foods:
        raise ValueError('Unknown food: ' + args.id)
    prompt = Path(args.prompt_file).read_text('utf-8-sig').strip()
    if not prompt:
        raise ValueError('Missing generation prompt')
    output = ROOT/'public/images'/f'art-{args.id}-20260923.webp'
    with Image.open(args.source) as source:
        # Web asset encoding only; no object/content edits or compositing.
        image = ImageOps.contain(source.convert('RGB'), (768, 512))
        image.save(output, 'WEBP', quality=84, method=6)
        width, height = image.size
    food = foods[args.id]
    record = {'url': '/images/' + output.name, 'alt': food['name'] + ' · AI 菜品示意图',
              'scope': 'illustration', 'illustrationSubject': args.id,
              'contextNote': '为' + food['name'] + '单独绘制的 AI 菜品示意图，用于认识菜式；不是餐馆实拍，实际做法与摆盘以现场为准。',
              'credit': '途算 · AI 菜品插画', 'license': 'AI-generated project artwork',
              'sourceUrl': 'https://github.com/ducky-yyds/tour-fee/blob/main/docs/generated-food-media.md',
              'licenseUrl': 'https://github.com/ducky-yyds/tour-fee/blob/main/docs/generated-food-media.md',
              'checkedAt': '2026-09-23', 'width': width, 'height': height,
              'bytes': output.stat().st_size, 'generator': 'Built-in imagegen', 'prompt': prompt,
              'modifications': 'WebP web asset, proportionally resized; no content retouching.'}
    pack = ROOT/'data/food-art-expansion'/f'{args.id}.json'
    pack.parent.mkdir(parents=True, exist_ok=True)
    pack.write_text(json.dumps({args.id: record}, ensure_ascii=False, indent=2)+'\n', 'utf-8')
    print(json.dumps({'food': args.id, 'asset': output.name, 'bytes': record['bytes']}))

if __name__ == '__main__':
    main()
