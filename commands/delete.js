import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #delete     ║
// ╚══════════════════════════════════════╝

export async function deleteMessage(sock, groupJid, senderJid, message) {

    try {
        // 1. Vérifier si le message est une réponse (reply)
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg?.stanzaId) {
            return await sock.sendMessage(groupJid, {
                text: '⚠️ *[Ozen.Bot]* Réponds à un message avec la commande pour le supprimer.'
            });
        }

        // 2. Normalisation des IDs pour la comparaison
        const botId = jidNormalizedUser(sock.user.id);
        const normalizedSender = jidNormalizedUser(senderJid);
        const quotedParticipant = jidNormalizedUser(quotedMsg.participant);

        // 3. Récupérer les infos du groupe
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;

        // 4. Vérifications des permissions
        const botInfo = participants.find(p => jidNormalizedUser(p.id) === botId);
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        
        const isBotAdmin = botInfo && botInfo.admin;
        const isSenderAdmin = senderInfo && senderInfo.admin;

        // Le message appartient-il au bot ?
        const isAuthorMe = quotedParticipant === botId;

        // Si ce n'est pas mon message, je dois être admin pour supprimer celui d'un autre
        if (!isAuthorMe && !isBotAdmin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je ne peux pas supprimer le message d\'un tiers car je ne suis pas *administrateur*.'
            });
        }

        // Seul un admin (ou le bot lui-même) peut déclencher la suppression
        if (!isSenderAdmin && normalizedSender !== botId) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent demander la suppression d\'un message.'
            });
        }

        // 5. Construction de la clé de suppression (Key)
        const key = {
            remoteJid: groupJid,
            id: quotedMsg.stanzaId,
            fromMe: isAuthorMe,
            participant: quotedMsg.participant // On garde l'ID original pour la clé WhatsApp
        };

        // 6. Exécution de la suppression
        await sock.sendMessage(groupJid, { delete: key });

        // 7. Message de confirmation temporaire
        const sent = await sock.sendMessage(groupJid, { text: '🗑️ Message supprimé.' });
        
        // Auto-suppression du message de confirmation après 3 secondes
        setTimeout(async () => {
            await sock.sendMessage(groupJid, { delete: sent.key });
        }, 3000);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur delete :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Impossible de supprimer ce message (peut-être trop ancien ou déjà supprimé).'
        });
    }
}