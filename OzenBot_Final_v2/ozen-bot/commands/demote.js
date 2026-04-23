// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #demote     ║
// ╚══════════════════════════════════════╝

export async function demoteMembers(sock, groupJid, targets, senderJid) {

    try {

        // ─── Récupérer les infos du groupe ───────────
        const groupMeta    = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid       = sock.user.id.replace(/:.*@/, '@');

        // ─── Vérifier que le bot est admin ───────────
        const botInfo = participants.find(p => p.id === botJid);
        if (!botInfo || !['admin', 'superadmin'].includes(botInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je dois être *administrateur* pour rétrograder des membres.'
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
                text: `⚠️ *[Ozen.Bot]* Mentionne un membre à rétrograder.\nEx : *#demote @membre*`
            });
            return;
        }

        // ─── Rétrograder ──────────────────────────────
        await sock.groupParticipantsUpdate(groupJid, targets, 'demote');

        // ─── Message de confirmation ─────────────────
        const list = targets.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `✅ *[Ozen.Bot]* ${targets.length} membre(s) rétrogradé(s) :\n${list}`,
            mentions: targets
        });

        console.log(`[Ozen.Bot] ⬇️ Demote exécuté — ${targets.length} membre(s) rétrogradé(s)`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur demote :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de la rétrogradation. Vérifie mes permissions.'
        });
    }
}