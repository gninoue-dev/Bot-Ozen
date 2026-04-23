// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #delete     ║
// ╚══════════════════════════════════════╝

export async function deleteMessage(sock, groupJid, senderJid, message) {

    try {

        // Vérifier si le message est une réponse
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        if (!contextInfo?.quotedMessage) {
            await sock.sendMessage(groupJid, {
                text: '⚠️ *[Ozen.Bot]* Réponds à un message pour le supprimer.\nEx : *#delete* (en réponse à un message)'
            });
            return;
        }

        // Vérifier si l'expéditeur est admin ou le bot
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid = sock.user.id.replace(/:.*@/, '@');

        const senderInfo = participants.find(p => p.id === senderJid);
        const isAdmin = senderInfo && ['admin', 'superadmin'].includes(senderInfo.admin);
        
        // Seul l'admin ou le bot peut supprimer
        if (!isAdmin && senderJid !== botJid) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent supprimer des messages.'
            });
            return;
        }

        // Clé du message à supprimer
        const messageKey = {
            remoteJid: groupJid,
            id: contextInfo.stanzaId,
            fromMe: false
        };

        // Supprimer le message
        await sock.sendMessage(groupJid, {
            delete: messageKey
        });

        await sock.sendMessage(groupJid, {
            text: '✅ *[Ozen.Bot]* Message supprimé.'
        });

        console.log(`[Ozen.Bot] 🗑️ Message supprimé dans ${groupJid}`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur delete :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de la suppression du message.'
        });
    }
}