# Studio Laguna 3 Les Maldives

Projet personnel (2026), conçu et développé avec **Claude Code**.

Achat d'un studio de 27,78 m² au 2ᵉ étage, face à la piscine lagon, au Laguna Beach Resort 3 « The Maldives » à Jomtien (Pattaya, Thaïlande), pour le mettre en location au mois.

**Site web :** https://henrilescure74330.github.io/Studio-Laguna3-Maldives/ (protégé par mot de passe)

**Site touristique « Laguna Beach Resort 3 The Maldives » :** https://henrilescure74330.github.io/Studio-Laguna3-Maldives/the-maldives/ (protégé par mot de passe, dossier `the-maldives/`, page d'entrée avec photos du resort en clair dans `the-maldives/accueil/`)

**Site location « Laguna 3 The Maldives · Location » :** https://henrilescure74330.github.io/Studio-Laguna3-Maldives/location/ (pour les clients et la famille qui louent le studio, sans la partie investissement ; protégé par mot de passe, dossier `location/`)

## Ce que présente le site

- **Le studio** : photos, vue sur le lagon depuis le balcon, idées de décoration
- **Le resort** : piscines lagon, Seven Eleven, petit centre commercial, spa, sauna, hammam, salle de sport, sécurité 24 h/24, parking voiture et scooter
- **Le quartier** : plage de Jomtien, couchers de soleil sur la mer, night market, temples, port pour l'île de Koh Lan
- **L'achat étape par étape** : de l'acompte au transfert au bureau foncier, entièrement à distance
- **Le coût réel** : frais officiels calculés sur la valeur cadastrale
- **La rentabilité** : simulateur de rendement (loyer 11 000 à 13 000 ฿ par mois, rendement net d'environ 8 à 10 %)

## Contenu du dépôt

| Dossier | Contenu |
| --- | --- |
| `docs/` | Site publié avec GitHub Pages, **chiffré** (la page et les photos) |
| `outils/` | Script qui chiffre le site (AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256, 600 000 itérations) |
| `data/` | Données du studio, anonymisées |

## Mettre à jour le site

La page en clair et les photos ne sont jamais versionnées. Après une modification de la source :

```bash
MOT_DE_PASSE=... python outils/chiffrer.py chemin/vers/site docs
# site touristique
MOT_DE_PASSE=... python outils/chiffrer.py chemin/vers/site-resort the-maldives --gabarit outils/gabarit_resort.html
MOT_DE_PASSE=... python outils/chiffrer.py chemin/vers/site-location location --gabarit outils/gabarit_resort.html
```

## Confidentialité

Aucune pièce d'identité, aucun numéro de lot ni aucune coordonnée bancaire n'est publié dans ce dépôt.
