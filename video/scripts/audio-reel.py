"""
La musica e gli effetti del video dei social (src/social/Reel.tsx), fatti
qui con un po' di sintesi: niente file presi da fuori, niente diritti.

    python3 audio-reel.py suoni.json uscita.wav

suoni.json lo scrive scripts/reel.ts:
{"fps": 30, "fotogrammi": 560, "seme": "id-del-post",
 "suoni": [{"tipo": "punto", "fotogramma": 140, "indice": 0}, ...]}

Il sottofondo è una marimba allegra in Do maggiore a 100 battiti al minuto
(Do, La minore, Fa, Sol) con un basso morbido e uno shaker leggero; sopra,
gli effetti a tempo con le animazioni (vedi suoniReel in
src/social/tempi-reel.ts). WAV a 48 kHz, stereo, 16 bit.
"""

import json
import sys
import wave
import zlib

import numpy as np

SR = 48_000
BATTITO = 60 / 100
OTTAVO = BATTITO / 2
# Do, La minore, Fa, Sol: un accordo per battuta (4 battiti), note MIDI.
ACCORDI = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
BASSI = [48, 45, 41, 43]
# Le note dell'arpeggio in ogni battuta (indici nell'accordo), un ottavo ciascuna.
ARPEGGIO = [0, 2, 1, 3, 2, 1, 2, 3]
# Do maggiore pentatonico in alto, per le scintille.
PENTATONICA = [84, 86, 88, 91, 93, 96]


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def tempo(durata: float) -> np.ndarray:
    return np.arange(int(durata * SR)) / SR


def marimba(freq: float, durata: float = 1.0, forza: float = 1.0) -> np.ndarray:
    """Un colpo di marimba: tre parziali che si spengono, le alte prima."""
    t = tempo(durata)
    parziali = [(1.0, 1.0, 3.2), (3.93, 0.3, 9.0), (9.2, 0.08, 20.0)]
    s = sum(a * np.exp(-d * t) * np.sin(2 * np.pi * freq * r * t) for r, a, d in parziali)
    return forza * s * np.minimum(1, t / 0.003)


def basso(freq: float, durata: float = 1.1) -> np.ndarray:
    t = tempo(durata)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t)
    return s * np.exp(-2.8 * t) * np.minimum(1, t / 0.01)


def shaker(rng: np.random.Generator, durata: float = 0.07) -> np.ndarray:
    rumore = np.diff(rng.standard_normal(int(durata * SR) + 1))
    return rumore * np.exp(-tempo(durata) * 55)


def soffio(rng: np.random.Generator, durata: float = 0.42) -> np.ndarray:
    """Un soffio che sale e scende: rumore filtrato con il taglio che si sposta."""
    n = int(durata * SR)
    rumore = rng.standard_normal(n)
    t = tempo(durata) / durata
    taglio = 300 + 2600 * np.sin(np.pi * t) ** 2
    a = np.exp(-2 * np.pi * taglio / SR)
    uscita = np.empty(n)
    y = 0.0
    for i in range(n):
        y = a[i] * y + (1 - a[i]) * rumore[i]
        uscita[i] = y
    return 2.2 * uscita * np.sin(np.pi * t) ** 2


def pop(freq: float) -> np.ndarray:
    """Il «pop» di un punto che compare: una goccia che sale di tono."""
    t = tempo(0.14)
    f = freq * (0.75 + 0.55 * np.minimum(1, t / 0.045))
    fase = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(fase) + 0.2 * np.sin(2 * fase)) * np.exp(-t * 30) * np.minimum(1, t / 0.002)


def tic(freq: float) -> np.ndarray:
    t = tempo(0.035)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 140)


def campana(freq: float) -> np.ndarray:
    t = tempo(1.6)
    parziali = [(1.0, 1.0, 1.6), (2.76, 0.45, 2.8), (5.4, 0.2, 4.5), (8.9, 0.08, 7.0)]
    s = sum(a * np.exp(-d * t) * np.sin(2 * np.pi * freq * r * t) for r, a, d in parziali)
    return s * np.minimum(1, t / 0.002)


def scintilla(rng: np.random.Generator) -> np.ndarray:
    """Cinque tintinnii alti, in disordine, nell'arco di un quarto di secondo."""
    suono = np.zeros(int(0.5 * SR))
    for k in range(5):
        inizio = int((k * 0.05 + rng.uniform(0, 0.02)) * SR)
        t = tempo(0.2)
        f = hz(rng.choice(PENTATONICA))
        blip = np.sin(2 * np.pi * f * t) * np.exp(-t * 22) * (0.8 - 0.1 * k)
        suono[inizio : inizio + len(blip)] += blip[: len(suono) - inizio]
    return suono


def entra() -> np.ndarray:
    """Uno «zip» che sale: la bussolina entra in scena."""
    t = tempo(0.18)
    f = 300 + 900 * (t / 0.18) ** 1.5
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.sin(np.pi * t / 0.18) * 0.6


class Mixer:
    def __init__(self, campioni: int):
        self.canali = np.zeros((2, campioni))

    def metti(self, suono: np.ndarray, secondi: float, volume: float, pan: float = 0.5):
        """Aggiunge `suono` a `secondi`; pan 0 tutto a sinistra, 1 tutto a destra."""
        inizio = int(secondi * SR)
        if inizio >= self.canali.shape[1]:
            return
        # Gli ultimi 8 ms sfumano: un suono tagliato di colpo fa un «clic».
        suono = suono.copy()
        coda = min(len(suono), int(0.008 * SR))
        suono[len(suono) - coda :] *= np.linspace(1, 0, coda)
        fine = min(self.canali.shape[1], inizio + len(suono))
        parte = suono[: fine - inizio] * volume
        self.canali[0, inizio:fine] += parte * np.sqrt(1 - pan)
        self.canali[1, inizio:fine] += parte * np.sqrt(pan)


def musica(mixer: Mixer, durata: float, rng: np.random.Generator):
    battuta = 0
    while battuta * 4 * BATTITO < durata:
        accordo = ACCORDI[battuta % 4]
        inizio = battuta * 4 * BATTITO
        for k, indice in enumerate(ARPEGGIO):
            forte = 0.7 if k in (0, 4) else 0.5
            mixer.metti(marimba(hz(accordo[indice] + 12), 0.9, forte), inizio + k * OTTAVO, 0.32, 0.35 if k % 2 else 0.65)
            mixer.metti(shaker(rng), inizio + k * OTTAVO + OTTAVO / 2, 0.05, 0.6)
        for b in (0, 2, 3.5):
            mixer.metti(basso(hz(BASSI[battuta % 4])), inizio + b * BATTITO, 0.13 if b != 3.5 else 0.08)
        battuta += 1


def effetti(mixer: Mixer, suoni: list, fps: float, rng: np.random.Generator):
    for s in suoni:
        quando = s["fotogramma"] / fps
        tipo = s["tipo"]
        if tipo == "passaggio":
            mixer.metti(soffio(rng), quando, 0.22)
        elif tipo == "entra":
            mixer.metti(entra(), quando, 0.25)
        elif tipo == "punto":
            # Do, Mi, Sol, Do: la nota sale a ogni punto.
            mixer.metti(pop(hz([72, 76, 79, 84][s.get("indice", 0) % 4])), quando, 0.55)
        elif tipo == "scintilla":
            mixer.metti(scintilla(rng), quando, 0.18, rng.uniform(0.3, 0.7))
        elif tipo == "conta":
            fotogrammi = s.get("durata", 30)
            for k in range(0, fotogrammi, 3):
                mixer.metti(tic(1200 + 900 * k / fotogrammi), quando + k / fps, 0.3)
        elif tipo == "cifra":
            mixer.metti(campana(hz(84)), quando, 0.4)
        elif tipo == "festa":
            for k, nota in enumerate([72, 76, 79, 84]):
                mixer.metti(marimba(hz(nota + 12), 1.0, 0.9), quando + k * 0.07, 0.4, 0.3 + 0.13 * k)
            mixer.metti(scintilla(rng), quando + 0.28, 0.18)


def main():
    dati = json.load(open(sys.argv[1], encoding="utf-8"))
    fps = dati["fps"]
    durata = dati["fotogrammi"] / fps
    rng = np.random.default_rng(zlib.crc32(dati.get("seme", "bleo").encode()))
    mixer = Mixer(int(durata * SR))
    musica(mixer, durata, rng)
    # Entrata morbida e chiusura sfumata della musica, prima degli effetti.
    t = np.arange(mixer.canali.shape[1]) / SR
    mixer.canali *= np.minimum(1, t / 0.4) * np.clip((durata - t) / 1.5, 0, 1)
    effetti(mixer, dati["suoni"], fps, rng)

    # Volume: valore efficace a -20 dBFS (circa -14 LUFS, come vogliono i
    # social), poi un limitatore morbido per i picchi.
    uscita = mixer.canali
    efficace = np.sqrt(np.mean(uscita**2)) or 1.0
    uscita = np.tanh(uscita * (10 ** (-20 / 20) / efficace) * 1.1) / np.tanh(1.1)
    uscita *= np.minimum(1, (durata - t) / 0.05).clip(0, 1)
    pcm = (np.clip(uscita, -1, 1) * 32_000).astype("<i2").T.reshape(-1)
    with wave.open(sys.argv[2], "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
