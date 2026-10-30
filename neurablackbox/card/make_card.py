#!/usr/bin/env python3
"""NEURABLACKBOX square game card — EYE CORE card style + QR. Art: Luca's cube motif."""
from pathlib import Path
import math
import numpy as np, qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

OUT = Path('/workspace/neurablackbox/card')
SRC = Path('/workspace/neura-cube/look/luca-cube-motiv.jpg')
URL = 'https://alza5-lab.github.io/quantenobjekt/neurablackbox/'
SIZE, BORDER = 3059, 220
GM = '/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf'
CYAN = (110, 225, 255)
VIO, GOLD, GRN = (168, 110, 255), (255, 196, 92), (80, 230, 150)

def F(size, w=400):
    f = ImageFont.truetype(GM, size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f

def tw(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

def spaced(d, xy, t, f, fill, track):
    x, y = xy
    for ch in t:
        d.text((x, y), ch, font=f, fill=fill); x += tw(d, ch, f) + track
    return x

def art():
    im = Image.open(SRC).convert('RGB')
    W0, H0 = im.size; im = im.crop((0, 0, W0, int(H0 * 0.882)))          # drop the bottom title text
    a = np.array(im).astype(np.float32)
    h = a.shape[0]; fade = np.ones(h, np.float32)
    fade[h-70:] = np.linspace(1, 0, 70) ** 1.5  # feather bottom edge into black
    a *= fade[:, None, None]
    im = Image.fromarray(a.astype(np.uint8))
    s = 2526 / h                              # Lanczos upscale (~2.5x)
    im = im.resize((int(im.width * s), int(h * s)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=60, threshold=2))
    return im

def glyph(sz=180):
    """White tile with black stacked-chip glyph (4 layers + core) — logo corner."""
    im = Image.new('RGB', (sz, sz), (250, 250, 248)); d = ImageDraw.Draw(im)
    cx = sz // 2
    for i in range(4):
        y = 30 + i * 22
        d.polygon([(cx, y), (cx + 62, y + 18), (cx, y + 36), (cx - 62, y + 18)], outline=(10, 10, 12), width=3)
    d.line((cx, 22, cx, 132), fill=(10, 10, 12), width=3)
    d.ellipse((cx - 9, 114, cx + 9, 132), fill=(10, 10, 12))
    f = F(17, 600); t = 'shivas_ocean'
    d.text(((sz - tw(d, t, f)) // 2, sz - 32), t, font=f, fill=(10, 10, 12))
    return im

def qr(target=560):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=1, border=0)
    q.add_data(URL); q.make(fit=True)
    M = np.array(q.get_matrix()); n = M.shape[0]; quiet = 4
    mod = target // (n + 2 * quiet); qs = mod * (n + 2 * quiet)
    img = Image.new('RGB', (qs, qs), 'white'); d = ImageDraw.Draw(img)
    for r in range(n):
        for c in range(n):
            if M[r, c]: d.rectangle(((c + quiet) * mod, (r + quiet) * mod, (c + quiet + 1) * mod - 1, (r + quiet + 1) * mod - 1), fill=(8, 10, 14))
    return img, q.version, qs

def vtext(cv, t, x, y, f, fill):
    tmp = ImageDraw.Draw(Image.new('L', (1, 1))); b = tmp.textbbox((0, 0), t, font=f)
    L = Image.new('RGBA', (b[2] - b[0] + 4, b[3] - b[1] + 4)); ImageDraw.Draw(L).text((-b[0] + 1, -b[1] + 1), t, font=f, fill=fill)
    R = L.rotate(90, expand=True); cv.alpha_composite(R, (x - R.width // 2, y)); return R.height

def grain(im, amt=12, seed=11):
    a = np.array(im).astype(np.float32); rng = np.random.default_rng(seed)
    a += rng.normal(0, amt, a.shape[:2])[..., None]
    r = np.roll(a[..., 0], -1, 1); b = np.roll(a[..., 2], 1, 1)
    a[..., 0] = a[..., 0] * .75 + r * .25; a[..., 2] = a[..., 2] * .75 + b * .25
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def compose():
    cv = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 255))
    A = art(); aw = SIZE - BORDER
    ax = BORDER + (aw - A.width) // 2 - 30; ay = 235
    # subtle cyan bloom behind the cube
    glow = Image.new('RGBA', (SIZE, SIZE)); gd = ImageDraw.Draw(glow)
    gd.ellipse((ax + 330, ay + 800, ax + 1480, ay + 2250), fill=(40, 110, 255, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(220)); cv = Image.alpha_composite(cv, glow)
    lum = A.convert('L').point(lambda v: min(255, int(v * 3)))
    cv.paste(A, (ax, ay), lum)               # screen-like paste on black (keeps glow, drops black box)
    # soft additive bloom
    bl = A.filter(ImageFilter.GaussianBlur(28)); bl = ImageEnhance.Brightness(bl).enhance(0.45)
    base = np.array(cv.convert('RGB')).astype(np.float32); B = np.zeros_like(base)
    B[ay:ay + bl.height, ax:ax + bl.width] = np.array(bl)[:SIZE - ay, :SIZE - ax]
    base = 255 - (255 - base) * (255 - B) / 255
    cv = Image.fromarray(base.astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(cv)
    d.rectangle((0, 0, BORDER - 1, SIZE), fill=(0, 0, 0, 255))
    d.line((BORDER - 1, 0, BORDER - 1, SIZE), fill=(30, 60, 80, 255), width=2)

    # vertical border terms
    terms = ['[ SIGNAL ]', '[ NETWORK ]', '[ MEMORY ]', '[ CORE ]', '[ BIO ]', '[ MACHINE ]', '[ HUMAN ]', '[ 360° ]', '[ LAYERS 4/4 ]']
    ft = F(24, 400); y = 90
    cols = [CYAN, CYAN, CYAN, CYAN, GRN, CYAN, GOLD, (210, 220, 230), (210, 220, 230)]
    for t, c in zip(terms, cols):
        y += vtext(cv, t, BORDER // 2, y, ft, (*c, 215)) + 34
    for i, c in enumerate([VIO, GOLD, GRN, CYAN]):   # small accent dots
        d.ellipse((BORDER // 2 - 9, y + 20 + i * 40, BORDER // 2 + 9, y + 38 + i * 40), fill=(*c, 255))

    # logo bottom-left
    g = glyph(180); lx = (BORDER - 180) // 2; ly = SIZE - 250
    d.rectangle((lx - 8, ly - 8, lx + 188, ly + 188), fill=(252, 252, 250, 255)); cv.paste(g, (lx, ly))

    # title block
    ov = Image.new('RGBA', (SIZE, SIZE)); od = ImageDraw.Draw(ov)
    tx, ty = BORDER + 80, 96
    fN, fB = F(132, 250), F(132, 800)
    wN = tw(od, 'NEURA', fN); wB = tw(od, 'BLACKBOX', fB)
    pw = max(wN + wB + 110, tw(od, 'Jeder Gedanke beginnt als Signal. Tauch ein in die Blackbox, Schicht für Schicht, bis zum Kern.', F(21, 400)) + 50)
    od.rounded_rectangle((tx - 40, ty - 36, tx + pw, ty + 370), radius=20, fill=(0, 0, 0, 150), outline=(70, 200, 255, 70), width=2)
    for ox, col in [(-3, (80, 220, 255, 90)), (3, (170, 90, 255, 70)), (0, (246, 249, 255, 255))]:
        od.text((tx + ox, ty), 'NEURA', font=fN, fill=col); od.text((tx + wN + ox, ty), 'BLACKBOX', font=fB, fill=col)
    spaced(od, (tx + 6, ty + 168), 'MICROCHIP // ENERGIE-DYNAMIK', F(42, 600), (*CYAN, 235), 6)
    od.text((tx + 6, ty + 236), 'Tauch ein bis zum Kern.', font=F(40, 400), fill=(230, 235, 245, 235))
    od.text((tx + 6, ty + 300), 'Jeder Gedanke beginnt als Signal. Tauch ein in die Blackbox, Schicht für Schicht, bis zum Kern.', font=F(21, 400), fill=(160, 175, 190, 200))
    for i, c in enumerate([VIO, GOLD, GRN]):
        od.ellipse((tx + pw - 120 + i * 30, ty + 186, tx + pw - 104 + i * 30, ty + 202), fill=(*c, 255))
    cv = Image.alpha_composite(cv, ov)

    # QR bottom-right
    q, ver, qs = qr(560); pad = 24
    qx = SIZE - qs - pad - 90; qy = SIZE - qs - pad - 130
    gl = Image.new('RGBA', (SIZE, SIZE)); ImageDraw.Draw(gl).rounded_rectangle((qx - pad - 12, qy - pad - 12, qx + qs + pad + 12, qy + qs + pad + 12), radius=36, fill=(100, 200, 255, 60))
    cv = Image.alpha_composite(cv, gl.filter(ImageFilter.GaussianBlur(20))); d = ImageDraw.Draw(cv)
    d.rounded_rectangle((qx - pad, qy - pad, qx + qs + pad, qy + qs + pad), radius=28, fill=(255, 255, 255, 255), outline=(150, 225, 255, 255), width=5)
    cv.paste(q, (qx, qy))
    fs = F(27, 700); s = 'SCAN // ENTER THE CORE'
    d.text((qx + (qs - tw(d, s, fs)) // 2, qy + qs + pad + 16), s, font=fs, fill=(*CYAN, 255))

    # footer credits
    fc = F(24, 400); bx = BORDER + 80
    d.text((bx, SIZE - 156), 'LAYERS 4/4 · BIO · MACHINE · HUMAN · shivas_ocean', font=fc, fill=(205, 215, 225, 230))
    d.text((bx, SIZE - 120), 'v0.1 · Luca Matteo Balzano 1991', font=fc, fill=(175, 185, 200, 215))
    d.text((bx, SIZE - 82), URL, font=F(19, 400), fill=(110, 135, 160, 190))
    d.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=(0, 0, 0, 255), width=6)

    rgb = grain(cv.convert('RGB'))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
    m = OUT / 'neurablackbox-gamecard.jpg'; rgb.save(m, quality=95, subsampling=0, optimize=True)
    rgb.resize((1181, 1181), Image.LANCZOS).save(OUT / 'neurablackbox-gamecard-100mm.jpg', quality=95, dpi=(300, 300), subsampling=0, optimize=True)
    # 106mm bleed: extend black edges by 35px around the 100mm trim
    t = rgb.resize((1181, 1181), Image.LANCZOS); b = Image.new('RGB', (1252, 1252), (0, 0, 0)); b.paste(t, (35, 35))
    b.save(OUT / 'neurablackbox-gamecard-bleed-3mm.jpg', quality=95, dpi=(300, 300), subsampling=0, optimize=True)
    print('QR v', ver, 'qs', qs, 'art', A.size, (ax, ay))

if __name__ == '__main__': compose()
