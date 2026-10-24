"""Chiffre le site du studio Laguna 3 pour la protéger par un mot de passe.

La page en clair et les photos ne sont jamais versionnées : seuls le texte
chiffré (AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256) et une
petite page de saisie du mot de passe sont publiés.

Usage :
    MOT_DE_PASSE=... python outils/chiffrer.py SOURCE_DIR SORTIE_DIR [--photos-integrees] [--base-photos URL]
"""
import argparse
import base64
import gzip
import os
import re
import secrets
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITERATIONS = 600_000
GABARIT = Path(__file__).with_name("gabarit_mot_de_passe.html")


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def cle(mot_de_passe: str, sel: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sel, iterations=ITERATIONS)
    return kdf.derive(mot_de_passe.encode())


def chiffrer(aes: AESGCM, donnees: bytes) -> bytes:
    iv = secrets.token_bytes(12)
    return iv + aes.encrypt(iv, donnees, None)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("source", type=Path)
    p.add_argument("sortie", type=Path)
    p.add_argument("--photos-integrees", action="store_true",
                   help="met les photos dans le texte chiffré au lieu de fichiers img/*.bin")
    p.add_argument("--base-photos", default="img/",
                   help="adresse où la page va chercher les photos chiffrées")
    p.add_argument("--compresser", action="store_true",
                   help="compresse la page avant de la chiffrer (fichier plus petit)")
    p.add_argument("--meme-cle-que", type=Path,
                   help="reprend le sel d'une page déjà chiffrée, pour lire ses photos avec la même clé")
    p.add_argument("--sans-photos", action="store_true",
                   help="n'écrit pas les photos chiffrées (elles sont lues depuis --base-photos)")
    args = p.parse_args()

    mot_de_passe = os.environ["MOT_DE_PASSE"]
    if args.meme_cle_que:
        sel = base64.b64decode(re.search(r'SEL = "([^"]+)"', args.meme_cle_que.read_text(encoding="utf-8")).group(1))
    else:
        sel = secrets.token_bytes(16)
    aes = AESGCM(cle(mot_de_passe, sel))
    html = (args.source / "index.html").read_text(encoding="utf-8")
    args.sortie.mkdir(parents=True, exist_ok=True)

    def photo(m: re.Match) -> str:
        nom = m.group(1)
        image = (args.source / "img" / f"{nom}.jpg").read_bytes()
        if args.photos_integrees:
            return f'src="data:image/jpeg;base64,{b64(image)}"'
        if not args.sans_photos:
            (args.sortie / "img").mkdir(exist_ok=True)
            (args.sortie / "img" / f"{nom}.bin").write_bytes(chiffrer(aes, image))
        return f'data-photo="{nom}"'

    html = re.sub(r'src="img/([\w-]+)\.jpg"', photo, html)
    contenu = gzip.compress(html.encode(), mtime=0) if args.compresser else html.encode()
    page = (GABARIT.read_text(encoding="utf-8")
            .replace("__SEL__", b64(sel))
            .replace("__ITERATIONS__", str(ITERATIONS))
            .replace("__BASE_PHOTOS__", args.base_photos)
            .replace("__COMPRESSE__", "true" if args.compresser else "false")
            .replace("__CONTENU__", b64(chiffrer(aes, contenu))))
    (args.sortie / "index.html").write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
