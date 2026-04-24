import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

// État des spams actifs par groupe
let spamActive = {}; 

/**
 * Gère le spam d'images (Urgence)
 */
export async function handleUrgence(sock, groupJid, senderJid) {
    try {
        // 1. Normalisation de l'ID de l'expéditeur
        const normalizedSender = jidNormalizedUser(senderJid);

        // 2. Vérification des permissions admin
        const groupMeta = await sock.groupMetadata(groupJid);
        const senderInfo = groupMeta.participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        
        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, { 
                text: "❌ *[Ozen.Bot]* Seuls les administrateurs peuvent lancer une alerte d'urgence." 
            });
        }

        // 3. Éviter les doublons
        if (spamActive[groupJid]) {
            return await sock.sendMessage(groupJid, { text: "⚠️ Une alerte est déjà en cours dans ce groupe." });
        }

        // 4. Vérification du fichier image
        const cheminImg = path.join(process.cwd(), 'ressources', 'images', 'photo.jpg');
        if (!fs.existsSync(cheminImg)) {
            return await sock.sendMessage(groupJid, { text: "❌ Fichier ressources/images/photo.jpg introuvable." });
        }

        const imageBuffer = fs.readFileSync(cheminImg);

        // Activer le spam
        spamActive[groupJid] = true;
        await sock.sendMessage(groupJid, { text: "🚀 *ALERTE DÉMARRÉE*\nTapez le préfixe suivi de *stop* pour arrêter." });

        // 5. Boucle de spam récursive optimisée
        const runSpam = async () => {
            // Condition d'arrêt immédiat
            if (!spamActive[groupJid]) return;

            try {
                await sock.sendMessage(groupJid, { 
                    image: imageBuffer, 
                    caption: "🚨 *URGENCE OZEN.BOT* 🚨" 
                });

                // Délai de 2.5s pour limiter les risques de bannissement par WhatsApp
                if (spamActive[groupJid]) {
                    setTimeout(runSpam, 2500); 
                }
            } catch (err) {
                console.error("❌ [Ozen.Bot] Erreur boucle spam:", err);
                delete spamActive[groupJid];
            }
        };

        runSpam();

    } catch (err) {
        console.error("❌ [Ozen.Bot] Erreur commande urgence:", err);
    }
}

/**
 * Arrête le spam
 */
export async function stopUrgence(sock, groupJid, senderJid) {
    // Optionnel : tu peux aussi vérifier si celui qui fait stop est admin
    const normalizedSender = jidNormalizedUser(senderJid);
    const groupMeta = await sock.groupMetadata(groupJid);
    const senderInfo = groupMeta.participants.find(p => jidNormalizedUser(p.id) === normalizedSender);

    if (!senderInfo || !senderInfo.admin) {
        return await sock.sendMessage(groupJid, { text: "❌ Seuls les admins peuvent stopper l'alerte." });
    }

    if (spamActive[groupJid]) {
        spamActive[groupJid] = false;
        delete spamActive[groupJid];
        await sock.sendMessage(groupJid, { text: "🛑 Alerte interrompue par un administrateur." });
    } else {
        await sock.sendMessage(groupJid, { text: "ℹ️ Aucune alerte active actuellement." });
    }
}