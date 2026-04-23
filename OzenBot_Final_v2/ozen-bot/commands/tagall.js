// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #tagall     ║
// ╚══════════════════════════════════════╝

export async function tagAll(sock, groupJid, senderJid, args) {

    try {

        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;

        // Filtrer les membres (exclure le bot)
        const botJid = sock.user.id.replace(/:.*@/, '@');
        const members = participants.filter(p => p.id !== botJid);

        if (members.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '⚠️ *[Ozen.Bot]* Aucun membre à mentionner.'
            });
            return;
        }

        // Message à envoyer (argument ou message par défaut)
        const message = args.length > 0 ? args.join(' ') : '📢 *Appel à tous les membres*';

        // Liste des mentions
        const mentions = members.map(p => p.id);
        const memberList = members.map(p => `• @${p.id.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `${message}\n\n${memberList}`,
            mentions: mentions
        });

        console.log(`[Ozen.Bot] 📢 TagAll exécuté — ${members.length} membres mentionnés`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur tagall :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de l\'appel aux membres.'
        });
    }
}