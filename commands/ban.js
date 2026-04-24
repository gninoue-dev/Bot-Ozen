import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #ban        ║
// ╚══════════════════════════════════════╝

export async function banMembers(sock, groupJid, targets, senderJid) {

    try {
        // 1. Récupérer les infos fraîches du groupe
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // 2. Normalisation des identifiants (Critique pour le Multi-Device)
        const botId = jidNormalizedUser(sock.user.id);
        const normalizedSender = jidNormalizedUser(senderJid);

        // 3. Vérifier que le bot est admin
        const botInfo = participants.find(p => jidNormalizedUser(p.id) === botId);
        if (!botInfo || !botInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Action impossible : je ne suis pas *administrateur*.'
            });
        }

        // 4. Vérifier que l'expéditeur est admin
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);
        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* du groupe peuvent bannir.'
            });
        }

        // 5. Vérifier les cibles
        if (!targets || targets.length === 0) {
            return await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Mentionne le(s) membre(s) à expulser ou saisis leur numéro.`
            });
        }

        // 6. Filtrage de sécurité (Logiciel robuste)
        const toBan = [];
        for (const targetJid of targets) {
            const normalizedTarget = jidNormalizedUser(targetJid);

            // Trouver le participant correspondant
            const targetInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedTarget);
            
            if (!targetInfo) continue; // Pas dans le groupe

            // Sécurité : ne pas s'auto-bannir
            if (normalizedTarget === botId) {
                await sock.sendMessage(groupJid, { text: "😂 Très drôle. Je ne vais pas m'auto-expulser." });
                continue;
            }

            // Sécurité : ne pas bannir le créateur
            if (targetInfo.admin === 'superadmin') {
                await sock.sendMessage(groupJid, { 
                    text: `❌ Impossible d'expulser le créateur du groupe (@${normalizedTarget.split('@')[0]}).`,
                    mentions: [normalizedTarget]
                });
                continue;
            }

            toBan.push(normalizedTarget);
        }

        if (toBan.length === 0) return;

        // 7. Exécution du bannissement
        await sock.groupParticipantsUpdate(groupJid, toBan, 'remove');

        // 8. Message de confirmation
        const list = toBan.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `🔨 *[Ozen.Bot]* Expulsion réussie :\n${list}`,
            mentions: toBan
        });

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur ban :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Une erreur est survenue lors de l\'expulsion.'
        });
    }
}