// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #urgence    ║
// ╚══════════════════════════════════════╝

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// messageEnregistré <- lire fichierExterne
const cheminFichier = join(__dirname, '..', 'config', 'urgence.txt');
let messageEnregistré = '';

if (existsSync(cheminFichier)) {
    messageEnregistré = readFileSync(cheminFichier, 'utf-8').trim();
}

// Stocker les intervalles d'urgence par groupe
const urgenceIntervals = new Map();

// saisiUser <- lire Entrée()
// Cette fonction est appelée quand l'utilisateur tape #urgence
export async function handleUrgence(sock, groupJid, senderJid, config) {

    // si saisiUser = "#urgence" alors
    // tantque vrai faire
    //     appeler message(messageEnregistré)
    // fintantque
    // finsi

    // Vérifier si l'urgence est déjà active
    if (urgenceIntervals.has(groupJid)) {
        await sock.sendMessage(groupJid, {
            text: '⚠️ *[Ozen.Bot]* L\'urgence est déjà active !\nUtilise *#stopUrgence* pour arrêter.'
        });
        return;
    }

    // Confirmer le démarrage
    await sock.sendMessage(groupJid, {
        text: `🚨 *[Ozen.Bot]* URGENCE démarrée !\n\nMessage : ${messageEnregistré}\n\nUtilise *#stopUrgence* pour arrêter.`
    });

    console.log(`[Ozen.Bot] 🚨 Urgence démarrée dans ${groupJid}`);

    // tantque vrai faire - boucle infinie
    const interval = setInterval(async () => {
        try {
            // appeler message(messageEnregistré)
            await sock.sendMessage(groupJid, { text: messageEnregistré });
        } catch (err) {
            console.error('[Ozen.Bot] Erreur envoi:', err);
        }
    }, 3000); // 3 secondes entre chaque message

    // Stocker l'intervalle pour pouvoir l'arrêter
    urgenceIntervals.set(groupJid, interval);
}

export async function stopUrgence(sock, groupJid, senderJid, config) {

    try {

        // Vérifier si l'urgence est active
        if (!urgenceIntervals.has(groupJid)) {
            await sock.sendMessage(groupJid, {
                text: '⚠️ *[Ozen.Bot]* Aucune urgence active dans ce groupe.'
            });
            return;
        }

        // Arrêter l'urgence
        clearInterval(urgenceIntervals.get(groupJid));
        urgenceIntervals.delete(groupJid);

        await sock.sendMessage(groupJid, {
            text: '✅ *[Ozen.Bot]* URGENCE arrêtée !'
        });

        console.log(`[Ozen.Bot] 🛑 Urgence arrêtée dans ${groupJid}`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur stopUrgence :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de l\'arrêt de l\'urgence.'
        });
    }
}

// Fonction pour recharger le message (appelée au démarrage)
export function getMessageEnregistré() {
    return messageEnregistré;
}

export function setMessageEnregistré(msg) {
    messageEnregistré = msg;
}