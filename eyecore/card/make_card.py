#!/usr/bin/env python3
"""EYE CORE square game card — robot-poster style + QR."""
from pathlib import Path
import math, random
import numpy as np
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

OUT = Path('/workspace/eyecore/card')
KEY = OUT / 'keyart_close.png'
URL = 'https://alza5-lab.github.io/quantenobjekt/eyecore/'
SIZE = 3059
BORDER = 220  # left black strip
SAFE = 70

FONT_DISP = '/usr/share/fonts/truetype/sand-box/google/Orbitron/Orbitron-VariableFont_wght.ttf'
FONT_MONO = '/usr/share/fonts/truetype/sand-box/google/IBM Plex Mono/IBMPlexMono-Regular.ttf'
FONT_MONO_B = '/usr/share/fonts/truetype/sand-box/google/IBM Plex Mono/IBMPlexMono-Bold.ttf'
FONT_SERIF = '/usr/share/fonts/truetype/sand-box/google/Playfair Display/PlayfairDisplay-VariableFont_wght.ttf'

def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight is not None and hasattr(f, 'set_variation_by_axes'):
        try: f.set_variation_by_axes([weight])
        except Exception: pass
    return f

def make_eye_logo(sz=280):
    """White square with black eye/core glyph + shivas_ocean — matches robot-poster logo corner."""
    im = Image.new('RGB', (sz, sz), (250, 250, 248))
    d = ImageDraw.Draw(im)
    cx = cy = sz // 2
    # outer oval frame
    d.ellipse((18, 14, sz-18, sz-42), outline=(10,10,12), width=4)
    # concentric rings (eye)
    for r, w in [(78, 3), (58, 2), (38, 2)]:
        d.ellipse((cx-r, cy-r-8, cx+r, cy+r-8), outline=(10,10,12), width=w)
    # pupil / core
    d.ellipse((cx-16, cy-16-8, cx+16, cy+16-8), fill=(10,10,12))
    # cyan iris hint as tiny ticks
    for a in range(0, 360, 30):
        rad = math.radians(a)
        x0 = cx + math.cos(rad)*44; y0 = cy-8 + math.sin(rad)*44
        x1 = cx + math.cos(rad)*54; y1 = cy-8 + math.sin(rad)*54
        d.line((x0,y0,x1,y1), fill=(20,20,24), width=2)
    # glitch bars
    d.rectangle((cx-70, cy+40, cx+70, cy+44), fill=(10,10,12))
    d.rectangle((cx-40, cy+52, cx+40, cy+55), fill=(10,10,12))
    # label
    f = font(FONT_SERIF, 22, 600)
    t = 'shivas_ocean'
    bb = d.textbbox((0,0), t, font=f)
    tw = bb[2]-bb[0]
    d.text(((sz-tw)//2, sz-36), t, font=f, fill=(10,10,12))
    return im

def make_qr(target_px=520):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=1, border=0)
    q.add_data(URL); q.make(fit=True)
    M = np.array(q.get_matrix()); n = M.shape[0]
    quiet = 4
    # module size so total ~ target
    mod = max(1, target_px // (n + 2*quiet))
    qs = mod * (n + 2*quiet)
    qimg = Image.new('RGB', (qs, qs), (255, 255, 255))
    qd = ImageDraw.Draw(qimg)
    for r in range(n):
        for c in range(n):
            if M[r, c]:
                x0 = (c+quiet)*mod; y0 = (r+quiet)*mod
                qd.rectangle((x0, y0, x0+mod-1, y0+mod-1), fill=(8, 10, 14))
    return qimg, q.version, n, mod, qs

def vertical_text(draw_img, text, x, y, font_obj, fill, spacing=6):
    """Draw text rotated 90° CCW (reads upward) using a temp layer."""
    # measure
    tmp = Image.new('RGBA', (10,10), (0,0,0,0))
    td = ImageDraw.Draw(tmp)
    bb = td.textbbox((0,0), text, font=font_obj)
    tw, th = bb[2]-bb[0]+4, bb[3]-bb[1]+4
    layer = Image.new('RGBA', (tw, th), (0,0,0,0))
    ImageDraw.Draw(layer).text((-bb[0]+1, -bb[1]+1), text, font=font_obj, fill=fill)
    rot = layer.rotate(90, expand=True)
    draw_img.alpha_composite(rot, (x - rot.width//2, y))
    return rot.height

def film_grain(im, amount=18, seed=42):
    arr = np.array(im).astype(np.float32)
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, arr.shape[:2]).astype(np.float32)
    for c in range(3):
        arr[..., c] = np.clip(arr[..., c] + noise, 0, 255)
    # slight chromatic offset for poster grit
    shift = 1
    r = np.roll(arr[...,0], -shift, axis=1)
    b = np.roll(arr[...,2], shift, axis=1)
    arr[...,0] = (arr[...,0]*0.7 + r*0.3)
    arr[...,2] = (arr[...,2]*0.7 + b*0.3)
    return Image.fromarray(arr.astype(np.uint8))

def compose():
    canvas = Image.new('RGBA', (SIZE, SIZE), (6, 6, 10, 255))
    # Key art — fill right of border, slight crop to focus character
    key = Image.open(KEY).convert('RGB')
    # Crop a bit from top if needed — keep square focus on hero
    kw, kh = key.size
    # Scale to cover art area
    art_w = SIZE - BORDER
    art_h = SIZE
    scale = max(art_w / kw, art_h / kh)
    nw, nh = int(kw*scale), int(kh*scale)
    key = key.resize((nw, nh), Image.LANCZOS)
    # center-crop to art area
    left = (nw - art_w)//2
    top = (nh - art_h)//2 - int(nh*0.02)  # slight upward bias
    key = key.crop((left, max(0,top), left+art_w, max(0,top)+art_h))
    if key.size != (art_w, art_h):
        key = key.resize((art_w, art_h), Image.LANCZOS)
    # vignette on key
    key_arr = np.array(key).astype(np.float32)
    yy, xx = np.mgrid[0:art_h, 0:art_w].astype(np.float32)
    cx, cy = art_w*0.48, art_h*0.42
    d = np.sqrt(((xx-cx)/art_w)**2 + ((yy-cy)/art_h)**2)
    vig = np.clip(1.15 - d*0.85, 0.55, 1.0)[..., None]
    key_arr *= vig
    key = Image.fromarray(np.clip(key_arr,0,255).astype(np.uint8))
    canvas.paste(key, (BORDER, 0))

    # Left black strip already black; add grain later
    # Vertical terms
    terms = [
        '[ PHASE ]', '[ SHIFT ]', '[ SKIP ]', '[ DRIFT ]',
        '[ GLITCH ]', '[ FRAGMENT ]', '[ 12 KNOTEN ]', '[ 5D ]',
        '[ EYE CORE ]', '[ ULTRA ]',
    ]
    fterm = font(FONT_MONO, 22)
    y = 80
    for t in terms:
        h = vertical_text(canvas, t, BORDER//2, y, fterm, (210, 220, 230, 200), spacing=4)
        y += h + 28

    # Logo bottom-left in border
    logo = make_eye_logo(180)
    lx = (BORDER - 180)//2
    ly = SIZE - 180 - 70
    # white pad
    pad = Image.new('RGB', (196, 196), (252,252,250))
    canvas.paste(pad, (lx-8, ly-8))
    canvas.paste(logo, (lx, ly))

    # Title block over art (top-left of art area)
    overlay = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    tx = BORDER + 70
    ty = 90
    ftitle = font(FONT_DISP, 118, 700)
    fsub = font(FONT_MONO_B, 42)
    ftag = font(FONT_MONO, 28)
    fcred = font(FONT_MONO, 22)
    # soft dark plate behind title for readability
    d.rounded_rectangle((tx-30, ty-30, tx+980, ty+310), radius=18, fill=(0,0,0,110))
    # title with slight cyan glow via multiple draws
    for ox, oy, col in [(-2,0,(80,220,255,90)), (2,0,(180,80,255,70)), (0,0,(245,248,255,255))]:
        ImageDraw.Draw(overlay).text((tx+ox, ty+oy), 'EYE CORE', font=ftitle, fill=col)
    ImageDraw.Draw(overlay).text((tx+4, ty+140), '5D SYSTEM', font=fsub, fill=(140, 230, 255, 230))
    tag = 'BUILD THE EYE. SEE THE CORE. CHANGE THE WORLD.'
    ImageDraw.Draw(overlay).text((tx+4, ty+200), tag, font=ftag, fill=(220, 225, 235, 210))
    canvas = Image.alpha_composite(canvas, overlay)

    # QR bottom-right
    qimg, ver, n, mod, qs = make_qr(540)
    pad_q = 22
    qx = SIZE - qs - pad_q - 90
    qy = SIZE - qs - pad_q - 110
    # glow plate
    glow = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((qx-pad_q-10, qy-pad_q-10, qx+qs+pad_q+10, qy+qs+pad_q+10),
                         radius=36, fill=(120, 200, 255, 55))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas, glow)
    qd = ImageDraw.Draw(canvas)
    qd.rounded_rectangle((qx-pad_q, qy-pad_q, qx+qs+pad_q, qy+qs+pad_q),
                         radius=28, fill=(255,255,255,255), outline=(160, 220, 255, 255), width=5)
    canvas.paste(qimg.convert('RGB'), (qx, qy))
    # SCAN label
    fscan = font(FONT_MONO_B, 26)
    scan = 'SCAN · BETRETEN'
    sbb = ImageDraw.Draw(canvas).textbbox((0,0), scan, font=fscan)
    sw = sbb[2]-sbb[0]
    ImageDraw.Draw(canvas).text((qx + (qs-sw)//2, qy+qs+pad_q+12), scan, font=fscan, fill=(140, 220, 255, 255))

    # Credits bottom-left of art area (right of logo strip)
    cred1 = 'v0.1 · shivas_ocean'
    cred2 = 'Luca Matteo Balzano 1991'
    ImageDraw.Draw(canvas).text((BORDER + 70, SIZE - 120), cred1, font=fcred, fill=(200, 210, 220, 220))
    ImageDraw.Draw(canvas).text((BORDER + 70, SIZE - 88), cred2, font=fcred, fill=(170, 180, 195, 200))
    # tiny URL under credits
    furl = font(FONT_MONO, 18)
    ImageDraw.Draw(canvas).text((BORDER + 70, SIZE - 56), URL, font=furl, fill=(120, 140, 160, 180))

    # Thin top/right/bottom black edge frames for polish
    fr = ImageDraw.Draw(canvas)
    fr.rectangle((0,0,SIZE-1,SIZE-1), outline=(0,0,0,255), width=6)

    # Film grain over whole card
    rgb = film_grain(canvas.convert('RGB'), amount=14, seed=7)
    # slight contrast bump
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    rgb = ImageEnhance.Color(rgb).enhance(1.08)

    # Save master 3059
    master = OUT / 'eyecore-gamecard.jpg'
    rgb.save(master, quality=95, subsampling=0, optimize=True)
    print('master', master, rgb.size, master.stat().st_size)
    print('QR version', ver, 'modules', n, 'modpx', mod, 'qs', qs)

    # 10x10 cm @300dpi = 1181
    trim = rgb.resize((1181, 1181), Image.LANCZOS)
    p10 = OUT / 'eyecore-gamecard-100mm.jpg'
    trim.save(p10, quality=95, dpi=(300,300), subsampling=0, optimize=True)
    print('10cm', p10, trim.size)

    # 3mm bleed: 106mm @300dpi ≈ 1252
    bleed_px = 1252
    bleed = rgb.resize((bleed_px, bleed_px), Image.LANCZOS)
    # content should be slightly larger so trim sits inside — already full-bleed art,
    # for print bleed we expand canvas by mirroring edges
    # Simpler: scale master so trim area (1181) centered in 1252
    o = (bleed_px - 1181)//2
    # rebuild: scale art to 1252 directly (bleed continues edge)
    pb = OUT / 'eyecore-gamecard-bleed-3mm.jpg'
    bleed.save(pb, quality=95, dpi=(300,300), subsampling=0, optimize=True)
    print('bleed', pb, bleed.size)
    return master, p10, pb, qs

if __name__ == '__main__':
    compose()
