// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #ban        ║
// ╚══════════════════════════════════════╝

export async function banMembers(sock, groupJid, targets, senderJid) {

    try {

        // ─── Récupérer les infos du groupe ───────────
        const groupMeta    = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid       = sock.user.id.replace(/:.*@/, '@');

        // ─── Vérifier que le bot est admin ───────────
        const botInfo = participants.find(p => p.id === botJid);
        if (!botInfo || !['admin', 'superadmin'].includes(botInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je dois être *administrateur* pour expulser des membres.'
            });
            return;
        }

        // ─── Vérifier que l'expéditeur est admin ─────
        const senderInfo = participants.find(p => p.id === senderJid);
        if (!senderInfo || !['admin', 'superadmin'].includes(senderInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent utiliser cette commande.'
            });
            return;
        }

        // ─── Vérifier qu'il y a des cibles ───────────
        if (!targets || targets.length === 0) {
            await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Mentionne un membre à expulser.\nEx : *#ban @membre*`
            });
            return;
        }

        // ─── Filtrer les membres présents ────────────
        const validTargets = targets.filter(jid =>
            participants.some(p => p.id === jid)
        );

        if (validTargets.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '⚠️ *[Ozen.Bot]* Les membres mentionnés ne sont pas dans ce groupe.'
            });
            return;
        }

        // ─── Expulser ────────────────────────────────
        await sock.groupParticipantsUpdate(groupJid, validTargets, 'remove');

        // ─── Message de confirmation ─────────────────
        const list = validTargets.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `✅ *[Ozen.Bot]* ${validTargets.length} membre(s) expulsé(s) :\n${list}`,
            mentions: validTargets
        });

        console.log(`[Ozen.Bot] 🔨 Ban exécuté — ${validTargets.length} membre(s) expulsé(s)`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur ban :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de l\'expulsion. Vérifie mes permissions.'
        });
    }
}
