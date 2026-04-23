# 🤖 Ozen.Bot v2.0

Bot WhatsApp multi-device personnel, basé sur [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).

## ⚡ Fonctionnalités

| Commande | Description |
|---|---|
| `#ban @membre` | Expulse un membre du groupe (admin requis) |
| `#aide` | Affiche le menu des commandes |
| Auto-Welcome | Message de bienvenue automatique à chaque nouveau membre |

## 🚀 Installation

### 1. Cloner le repos
```bash
git clone https://github.com/gninoue-dev/ozen-bot.git
cd ozen-bot
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer le numéro
Dans `config.json`, remplace `TON_NUMERO_ICI` par ton numéro WhatsApp (sans le +) :
```json
{
  "number": "2250701234567"
}
```

### 4. Démarrer
```bash
npm start
```

Un **Pairing Code** s'affichera dans le terminal. Entre-le dans WhatsApp :
> Paramètres → Appareils connectés → Connecter un appareil → Numéro de téléphone

## ☁️ Déploiement sur KataBump ou sur un autre panel 

1. Crée un serveur **Node.js 20.x** sur [control.katabump.com](https://control.katabump.com)
2. Dans la console, tape :
```bash
git clone https://github.com/gninoue-dev/ozen-bot.git .
```
3. Commande de démarrage : `node index.js`
4. Lance le serveur et récupère le Pairing Code dans les logs

## ⚙️ Configuration

Édite `config.json` pour personnaliser le bot :

```json
{
  "number": "TON_NUMERO",
  "prefix": "#",
  "botName": "Ozen.Bot",
  "welcome": true,
  "welcomeMessage": "👋 Bienvenue dans le groupe *{group}*, @{number} !\nNous sommes heureux de t'avoir parmi nous. 🎉"
}
```

| Champ | Description |
|---|---|
| `number` | Ton numéro WhatsApp (sans +) |
| `prefix` | Préfixe des commandes |
| `welcome` | Active/désactive le message de bienvenue |
| `welcomeMessage` | Texte du message (`{group}` = nom du groupe, `{number}` = numéro) |

---
*Ozen.Bot — Toujours disponible pour vous servie*
