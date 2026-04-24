import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #add        ║
// ╚══════════════════════════════════════╝

export async function addMembers(sock, groupJid, targets, senderJid) {
    try {
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // Normalisation des IDs (enlève les :1, :2 etc.)
        const botId = jidNormalizedUser(sock.user.id);
        const normalizedSender = jidNormalizedUser(senderJid);

        // --- Vérifier que le bot est admin ---
        const botInfo = participants.find(p => jidNormalizedUser(p.id) === botId);
        if (!botInfo || !botInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je ne peux pas ajouter de membres car je ne suis pas *administrateur*.'
            });
        }

        // --- Vérifier que l'expéditeur est admin ---
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent utiliser cette commande.'
            });
        }

        // --- Vérifier qu'il y a des cibles ---
        if (!targets || targets.length === 0) {
            return await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Utilisation incorrecte.\nExemple : \`!add 225XXXXXXXX\` ou mentionnez un contact.`
            });
        }

        // --- Exécution de l'ajout ---
        const response = await sock.groupParticipantsUpdate(groupJid, targets, 'add');

        for (const res of response) {
            if (res.status === "403") {
                await sock.sendMessage(groupJid, {
                    text: `⚠️ @${res.jid.split('@')[0]} a restreint ses ajouts. Invitation envoyée en privé.`,
                    mentions: [res.jid]
                });
            }
        }

        const list = targets.map(jid => `• @${jid.split('@')[0]}`).join('\n');
        await sock.sendMessage(groupJid, {
            text: `✅ *[Ozen.Bot]* Tentative d'ajout terminée :\n${list}`,
            mentions: targets
        });

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur add :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Une erreur est survenue (Utilisateur déjà présent ou erreur serveur).'
        });
    }
}