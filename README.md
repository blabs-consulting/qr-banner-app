# QR Banner Generator 🚀

Générateur de bannières avec QR code intégré. Transforme une URL en image PNG (960x540px) avec QR code overlay + texte/logo personnalisables. **Neutre et prêt pour Voyage On Demand**.

[![Démo](https://qr-banner-app.vercel.app/)](https://qr-banner-app.vercel.app/)

## Fonctionnalités
- Génération QR code depuis URL produit
- Overlay PNG transparent (logo/calque)
- Texte personnalisable (font, position, couleur)
- Dimensions fixes : 960×540px (optimisé bannières)
- API REST pour intégration VOD/OTT
- 100% serverless (aucun serveur requis)

## Déploiement Rapide 🚀

### Option 1 : Vercel (Recommandé - 2 min)
```bash
# 1. Fork/clone ce repo
git clone https://github.com/blabs-consulting/qr-banner-app.git
cd qr-banner-app

# 2. Installer (optionnel, Vercel auto-détecte)
npm install

# 3. Push sur ton repo GitHub
git remote set-url origin https://github.com/ton-org/qr-banner-app.git
git push origin main

# 4. Déployer sur Vercel
# → vercel.com → New Project → Import GitHub repo
# → Deploy auto ! URL live en 60s
