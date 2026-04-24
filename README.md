# 🤖 Ozen.Bot v2.0
> **Assistant WhatsApp Multi-Device** performant, modulaire et facile à déployer.

Basé sur la bibliothèque robuste [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys), **Ozen.Bot** est conçu pour la gestion de communauté et l'automatisation de tâches directement via votre compte WhatsApp.

---

## ⚡ Fonctionnalités principales

| Catégorie | Commande | Description |
| :--- | :--- | :--- |
| **Général** | `#aide` / `#menu` | Affiche l'interface d'aide interactive |
| | `#ping` | Teste la latence et la réactivité du bot |
| **Groupe** | `#tagall` | Mentionne tous les membres (Admin requis) |
| | `#info` | Affiche les détails techniques du groupe |
| **Modération** | `#ban` / `#kick` | Expulse un membre par mention ou réponse |
| | `#promote` | Nomme un membre administrateur |
| **Sécurité** | `#antispam` | Active/Désactive la protection contre le flood |
| | `#vu` | Récupère le contenu d'un message à **vue unique** |
| **Système** | `#urgence` | Mode spam/alerte (Réservé aux Admins Bot) |

---

## 🚀 Installation & Lancement

### 1. Prérequis
* [Node.js](https://nodejs.org/) (v20.x ou plus)
* [Git](https://git-scm.com/)

### 2. Configuration locale
```bash
# Cloner le dépôt
git clone https://github.com/gninoue-dev/ozen-bot.git
cd ozen-bot

# Installer les dépendances
npm install

# Configurer vos accès
nano config.json
```

### 3. Connexion
Lancez le bot avec :
```bash
npm start
```
Un **Pairing Code** (ex: `A1B2-C3D4`) s'affichera. Pour lier le bot :
1. Ouvrez **WhatsApp** sur votre téléphone.
2. Allez dans **Paramètres** → **Appareils connectés**.
3. Sélectionnez **Connecter un appareil** → **Lier avec le numéro de téléphone**.
4. Saisissez le code affiché dans votre terminal.

---

## ⚙️ Paramétrage (`config.json`)

Le fichier de configuration permet de personnaliser le comportement du bot sans toucher au code source :

```json
{
  "number": "2250701234567",
  "prefix": "#",
  "botName": "Ozen.Bot",
  "welcome": true,
  "welcomeMessage": "👋 Bienvenue @{number} dans *{group}* ! 🎉",
  "admins": ["2250103508128"]
}
```

| Champ | Description |
| :--- | :--- |
| `number` | Votre numéro WhatsApp complet (identifiant de session) |
| `prefix` | Le symbole pour déclencher les commandes (ex: `#`, `!`, `/`) |
| `admins` | Liste des numéros autorisés à utiliser les fonctions sensibles |
| `welcome` | Active ou désactive les messages de bienvenue automatiques |

---

## ☁️ Déploiement Cloud (KataBump / Panel)

Ozen.Bot est optimisé pour les environnements de type Panel (Pterodactyl) :

1. Créez un serveur **Node.js 20.x**.
2. Dans l'onglet **Startup**, assurez-vous que le fichier principal est `index.js`.
3. Importez vos fichiers via GitHub ou l'explorateur de fichiers.
4. Lancez le serveur et surveillez la **Console** pour récupérer votre Pairing Code.

---

## 🛠️ Architecture Technique (L2 Génie Logiciel)
Le projet utilise des principes modernes de développement :
* **Modularité :** Chaque commande est isolée dans `/commands`.
* **Event-Driven :** Utilisation des écouteurs d'événements de Baileys pour la gestion des messages et des participants.
* **Persistance :** Gestion des états de connexion via `useMultiFileAuthState`.

---
*Ozen.Bot — Conçu avec passion pour l'automatisation.*