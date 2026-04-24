import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #demote     ║
// ╚══════════════════════════════════════╝

export async function demoteMembers(sock, groupJid, targets, senderJid) {

    try {
        // 1. Récupérer les infos du groupe
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // 2. Normalisation des IDs (Essentiel pour le Multi-Device)
        const botId = jidNormalizedUser(sock.user.id);
        const normalizedSender = jidNormalizedUser(senderJid);

        // 3. Vérifier que le bot est admin
        const botInfo = participants.find(p => jidNormalizedUser(p.id) === botId);
        if (!botInfo || !botInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je ne peux pas modifier les rangs car je ne suis pas *administrateur*.'
            });
        }

        // 4. Vérifier que l'expéditeur est admin
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent rétrograder d\'autres membres.'
            });
        }

        // 5. Vérifier les cibles
        if (!targets || targets.length === 0) {
            return await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Mentionne le(s) membre(s) à rétrograder ou saisis leur numéro.`
            });
        }

        // 6. Filtrage de sécurité (Validation des cibles)
        const toDemote = [];
        for (const targetJid of targets) {
            const normalizedTarget = jidNormalizedUser(targetJid);
            const user = participants.find(p => jidNormalizedUser(p.id) === normalizedTarget);

            // Ignorer si l'utilisateur n'est pas dans le groupe
            if (!user) continue;

            // Empêcher de rétrograder le bot lui-même
            if (normalizedTarget === botId) {
                await sock.sendMessage(groupJid, { text: "❌ Je ne peux pas me rétrograder moi-même." });
                continue;
            }

            // Empêcher de rétrograder le SuperAdmin (le créateur)
            if (user.admin === 'superadmin') {
                await sock.sendMessage(groupJid, { 
                    text: `❌ Impossible de rétrograder le créateur du groupe (@${normalizedTarget.split('@')[0]}).`,
                    mentions: [normalizedTarget]
                });
                continue;
            }

            // Vérifier si l'utilisateur est déjà un simple membre
            if (!user.admin) {
                await sock.sendMessage(groupJid, { 
                    text: `ℹ️ @${normalizedTarget.split('@')[0]} n'est pas administrateur.`,
                    mentions: [normalizedTarget]
                });
                continue;
            }

            toDemote.push(normalizedTarget);
        }

        if (toDemote.length === 0) return;

        // 7. Exécution de la rétrogradation
        await sock.groupParticipantsUpdate(groupJid, toDemote, 'demote');

        // 8. Message de confirmation
        const list = toDemote.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `⬇️ *[Ozen.Bot]* Accès administrateur retiré pour :\n${list}`,
            mentions: toDemote
        });

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur demote :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Une erreur est survenue lors de la rétrogradation.'
        });
    }
}