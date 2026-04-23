// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #leave      ║
// ╚══════════════════════════════════════╝

export async function leaveGroup(sock, groupJid, senderJid) {

    try {

        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // Vérifier si l'expéditeur est admin
        const senderInfo = participants.find(p => p.id === senderJid);
        if (!senderInfo || !['admin', 'superadmin'].includes(senderInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent utiliser cette commande.'
            });
            return;
        }

        // Message d'au revoir
        await sock.sendMessage(groupJid, {
            text: `👋 *[Ozen.Bot]* Je quitte le groupe.\nMerci de m'avoir utilisé ! À bientôt.`
        });

        // Quitter le groupe
        await sock.groupLeave(groupJid);

        console.log(`[Ozen.Bot] 👋 Bot quitté le groupe "${groupMeta.subject}"`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur leave :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de la sortie du groupe.'
        });
    }
}