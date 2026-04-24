// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #tagall     ║
// ╚══════════════════════════════════════╝

export async function tagAll(sock, groupJid, senderJid, args) {

    try {
        // 1. Récupérer les métadonnées et vérifier les permissions
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;

        const senderInfo = participants.find(p => p.id === senderJid);
        if (!senderInfo || !['admin', 'superadmin'].includes(senderInfo.admin)) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent taguer tout le monde.'
            });
        }

        // 2. Filtrer les membres
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const members = participants.filter(p => p.id !== botId);

        if (members.length === 0) {
            return await sock.sendMessage(groupJid, { text: '⚠️ Aucun membre trouvé.' });
        }

        // 3. Préparer le message
        // On récupère le texte après la commande, sinon message par défaut
        const extraMessage = args.length > 0 ? args.join(' ') : 'Appel général !';
        
        let tagMessage = `📢 *ANNONCE GROUPE*\n\n`;
        tagMessage += `📝 *Message :* ${extraMessage}\n\n`;
        tagMessage += `👥 *Membres :* ${members.length}\n\n`;

        // 4. Construire la liste visuelle et collecter les JIDs pour la notification
        const jids = [];
        members.forEach((mem, i) => {
            tagMessage += ` @${mem.id.split('@')[0]}${(i + 1) % 3 === 0 ? '\n' : ' '}`;
            jids.push(mem.id);
        });

        tagMessage += `\n\n_Ozen.Bot — Communication rapide_`;

        // 5. Envoi unique avec toutes les mentions "cachées" dans l'objet mentions
        await sock.sendMessage(groupJid, {
            text: tagMessage,
            mentions: jids
        });

        console.log(`[Ozen.Bot] 📢 TagAll par ${senderJid} (${members.length} membres)`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur tagall :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Une erreur est survenue lors du marquage.'
        });
    }
}