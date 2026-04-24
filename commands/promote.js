import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #promote    ║
// ╚══════════════════════════════════════╝

export async function promoteMembers(sock, groupJid, targets, senderJid) {

    try {
        // 1. Récupérer les métadonnées du groupe
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // 2. Normalisation des IDs pour la comparaison logique
        const botId = jidNormalizedUser(sock.user.id);
        const normalizedSender = jidNormalizedUser(senderJid);

        // 3. Vérification des droits du bot
        const botInfo = participants.find(p => jidNormalizedUser(p.id) === botId);
        if (!botInfo || !botInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Action impossible : je ne suis pas *administrateur*.'
            });
        }

        // 4. Vérification des droits de l'expéditeur
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent nommer d\'autres admins.'
            });
        }

        // 5. Vérification des cibles (mentions ou numéros extraits)
        if (!targets || targets.length === 0) {
            return await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Mentionne le(s) membre(s) à promouvoir ou saisis leur numéro.`
            });
        }

        // 6. Filtrage intelligent des participants
        const toPromote = [];
        for (const targetJid of targets) {
            const normalizedTarget = jidNormalizedUser(targetJid);
            const user = participants.find(p => jidNormalizedUser(p.id) === normalizedTarget);

            // Ignorer si l'utilisateur n'est pas dans le groupe
            if (!user) continue;

            // Vérifier si l'utilisateur est déjà administrateur
            if (user.admin) {
                await sock.sendMessage(groupJid, { 
                    text: `ℹ️ @${normalizedTarget.split('@')[0]} est déjà administrateur.`,
                    mentions: [normalizedTarget]
                });
                continue;
            }

            toPromote.push(normalizedTarget);
        }

        if (toPromote.length === 0) return;

        // 7. Mise à jour des privilèges sur WhatsApp
        await sock.groupParticipantsUpdate(groupJid, toPromote, 'promote');

        // 8. Message de succès
        const list = toPromote.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `⏫ *[Ozen.Bot]* Promotion réussie :\n${list}`,
            mentions: toPromote
        });

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur promote :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Une erreur est survenue lors de la promotion.'
        });
    }
}