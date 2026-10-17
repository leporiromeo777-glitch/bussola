"""
Taglia la bussolina (public/mascotte/bussolina.webp, 540×720, sfondo
trasparente) in pezzi per animarla come un burattino di carta (cut-out):

  corpo        la cassa con il quadrante, senza occhi né bocca (ridipinti col
               colore del quadrante, così si possono chiudere gli occhi)
  ago          l'ago rosso e bianco sopra il pomello (perno alla base)
  braccio-dx   il braccio alzato a destra (perno alla spalla)
  braccio-sx   il braccio a sinistra, giù (perno alla spalla)
  gamba-sx / gamba-dx   le gambe (perno all'anca)
  occhio-sx / occhio-dx / bocca   per sbattere gli occhi e cambiare bocca

Ogni pezzo è un PNG grande come l'immagine (540×720), così nel video stanno
tutti nello stesso punto e girano attorno al loro perno. Braccia, gambe e ago
vanno DIETRO al corpo: la radice resta nascosta quando girano. Per non lasciare
buchi alle giunture, ogni arto ha una «toppa» del suo colore che continua sotto
la cassa fino al perno.

Le posizioni (perni, centro di occhi e bocca) finiscono in pezzi.json.

  python3 scripts/taglia-bussolina.py <bussolina.webp> <cartella-di-uscita> [pezzi.json]

(scripts/prepara.ts lo lancia con public/bussolina/ e
src/presentatore/pezzi-bussolina.json, che il video importa.)

Serve Python 3 con Pillow e NumPy.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sorgente, uscita = Path(sys.argv[1]), Path(sys.argv[2])
file_pezzi = Path(sys.argv[3]) if len(sys.argv) > 3 else uscita / "pezzi.json"
uscita.mkdir(parents=True, exist_ok=True)

img = Image.open(sorgente).convert("RGBA")
L, A = img.size  # 540 × 720
px = np.array(img).astype(np.float32)
r, g, b, alfa = px[..., 0], px[..., 1], px[..., 2], px[..., 3]
yy, xx = np.mgrid[0:A, 0:L]


def maschera_pil(m: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8), "L")


def da_pil(im: Image.Image) -> np.ndarray:
    return np.array(im).astype(np.float32) / 255


def salva(nome: str, rgb: np.ndarray, a: np.ndarray) -> None:
    out = np.dstack([rgb, np.clip(a, 0, 255)]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(uscita / f"{nome}.png", optimize=True)


# 1. La cassa: il verde acqua dell'anello (con il pomello) e tutto quello che
#    racchiude. Il quadrante si trova riempiendo da fuori: ciò che non si
#    raggiunge senza attraversare l'anello è dentro.
verde = (alfa > 8) & (g - r > 15) & (b - r > 15)
riempi = Image.fromarray(np.where(verde, 255, 0).astype(np.uint8), "L").copy()
ImageDraw.floodfill(riempi, (0, 0), 128)
dentro = np.array(riempi) != 128
# Un pixel in più e il bordo sfumato, come l'antialias dell'originale.
m_corpo = da_pil(maschera_pil(dentro.astype(np.float32)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))
m_corpo = np.maximum(m_corpo, dentro.astype(np.float32))

centro_corpo = np.array([xx[dentro].mean(), yy[dentro].mean()])
cima_pomello = int(yy[dentro].min())

# 2. Il resto (fuori dalla cassa) si divide per zone.
resto = alfa * (1 - m_corpo)
zone = {
    "ago": (yy < cima_pomello + 8) & (xx > 170) & (xx < 300),
    "braccio-dx": (xx >= 400) & (yy >= cima_pomello + 8),
    "braccio-sx": (xx < 100) & (yy >= cima_pomello + 8),
    "gamba-sx": (xx >= 100) & (xx < centro_corpo[0]) & (yy >= 560),
    "gamba-dx": (xx >= centro_corpo[0]) & (xx < 400) & (yy >= 560),
}
avanzi = resto * (1 - np.any(np.stack(list(zone.values())), axis=0))
if (avanzi > 40).sum() > 30:
    print(f"Attenzione: {(avanzi > 40).sum()} pixel fuori da tutte le zone")

pezzi: dict = {"lato": [L, A]}
rgb = px[..., :3]


def toppa(nome: str, a: np.ndarray) -> tuple[np.ndarray, np.ndarray, list[float]]:
    """
    Aggiunge sotto la cassa una toppa del colore dell'arto, dalla radice
    (dove l'arto tocca la cassa) fino al perno, 26 px più dentro.
    """
    vicino = da_pil(maschera_pil(m_corpo).filter(ImageFilter.MaxFilter(7))) > 0.5
    radice = (a > 128) & vicino
    ys, xs = np.nonzero(radice)
    c = np.array([xs.mean(), ys.mean()])
    raggio = max(10.0, 0.5 * max(xs.max() - xs.min(), ys.max() - ys.min()))
    verso = centro_corpo - c
    verso /= np.linalg.norm(verso)
    perno = c + verso * 26
    # Colore dell'arto poco fuori dalla cassa (non proprio nell'ombra della radice).
    distanza = np.hypot(xx - c[0], yy - c[1])
    vicini = (a > 200) & (distanza > 12) & (distanza < 40)
    colore = np.median(rgb[vicini], axis=0)
    t = Image.new("L", (L, A), 0)
    d = ImageDraw.Draw(t)
    d.line([tuple(c), tuple(perno + verso * raggio * 0.6)], fill=255, width=int(raggio * 2))
    for p in (c, perno):
        d.ellipse([p[0] - raggio, p[1] - raggio, p[0] + raggio, p[1] + raggio], fill=255)
    m_toppa = da_pil(t.filter(ImageFilter.GaussianBlur(1.0))) * (m_corpo > 0.02)
    # L'arto sopra la toppa.
    fa = a / 255
    a_out = fa + m_toppa * (1 - fa)
    rgb_out = (rgb * fa[..., None] + colore * (m_toppa * (1 - fa))[..., None]) / np.maximum(a_out, 1e-6)[..., None]
    return rgb_out, a_out * 255, [round(float(perno[0]), 1), round(float(perno[1]), 1)]


for nome, zona in zone.items():
    a = resto * zona
    if nome == "ago":
        ys, xs = np.nonzero(a > 128)
        base = ys.max()
        perno = [round(float(xs[ys > base - 6].mean()), 1), float(base)]
        salva(nome, rgb, a)
    else:
        rgb_p, a_p, perno = toppa(nome, a)
        salva(nome, rgb_p, a_p)
    ys, xs = np.nonzero(a > 128)
    pezzi[nome] = {"perno": perno, "riquadro": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]}

# 3. Occhi e bocca: le macchie scure sul quadrante.
viso_interno = np.hypot(xx - centro_corpo[0], yy - centro_corpo[1]) < 150
# (senza le losanghe verdi ai lati, che hanno il bordo scuro)
scuro = dentro & viso_interno & ~verde & (r < 90) & (g < 80) & (b < 80) & (yy > 330) & (yy < 480)
scuro &= np.abs(xx - centro_corpo[0]) < 115


def riquadro(m: np.ndarray) -> list[int]:
    ys, xs = np.nonzero(m)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]


parti = {
    "occhio-sx": scuro & (xx < centro_corpo[0] - 40),
    "occhio-dx": scuro & (xx > centro_corpo[0] + 30),
    "bocca": scuro & (xx >= centro_corpo[0] - 40) & (xx <= centro_corpo[0] + 30),
}
corpo_rgb = rgb.copy()
da_dipingere = np.zeros((A, L), bool)
for nome, m in parti.items():
    x0, y0, x1, y1 = riquadro(m)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2 + 7, (y1 - y0) / 2 + 7
    ell = Image.new("L", (L, A), 0)
    ImageDraw.Draw(ell).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    m_ell = da_pil(ell.filter(ImageFilter.GaussianBlur(1.5)))
    salva(nome, rgb, alfa * m_ell)
    pezzi[nome] = {"centro": [round(cx, 1), round(cy, 1)], "raggi": [round(rx, 1), round(ry, 1)]}
    da_dipingere |= da_pil(ell.filter(ImageFilter.MaxFilter(5))) > 0.01

# Sotto occhi e bocca il quadrante si ridipinge «per diffusione»: ogni pixel
# prende la media dei vicini, partendo dal bordo, finché la sfumatura è liscia.
noti = ~da_dipingere
media_bordo = corpo_rgb[da_pil(maschera_pil(da_dipingere.astype(np.float32)).filter(ImageFilter.MaxFilter(9))).astype(bool) & noti].mean(axis=0)
viso = np.where(da_dipingere[..., None], media_bordo, corpo_rgb)
for _ in range(600):
    vicini = (np.roll(viso, 1, 0) + np.roll(viso, -1, 0) + np.roll(viso, 1, 1) + np.roll(viso, -1, 1)) / 4
    viso = np.where(da_dipingere[..., None], vicini, corpo_rgb)
# Un filo di grana, come la plastica del rendering.
rng = np.random.default_rng(7)
viso = np.where(da_dipingere[..., None], viso + rng.normal(0, 1.2, viso.shape), viso)
pezzi["colore-viso"] = "#%02x%02x%02x" % tuple(int(c) for c in media_bordo)

salva("corpo", viso, alfa * m_corpo)
pezzi["corpo"] = {"centro": [round(float(centro_corpo[0]), 1), round(float(centro_corpo[1]), 1)]}

file_pezzi.write_text(json.dumps(pezzi, indent=2) + "\n")
print(f"Pezzi in {uscita}, misure in {file_pezzi}")
