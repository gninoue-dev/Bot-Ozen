// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #promote    ║
// ╚══════════════════════════════════════╝

export async function promoteMembers(sock, groupJid, targets, senderJid) {

    try {

        // ─── Récupérer les infos du groupe ───────────
        const groupMeta    = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid       = sock.user.id.replace(/:.*@/, '@');

        // ─── Vérifier que le bot est admin ───────────
        const botInfo = participants.find(p => p.id === botJid);
        if (!botInfo || !['admin', 'superadmin'].includes(botInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je dois être *administrateur* pour promouvoir des membres.'
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
                text: `⚠️ *[Ozen.Bot]* Mentionne un membre à promouvoir.\nEx : *#promote @membre*`
            });
            return;
        }

        // ─── Promouvoir ───────────────────────────────
        await sock.groupParticipantsUpdate(groupJid, targets, 'promote');

        // ─── Message de confirmation ─────────────────
        const list = targets.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `✅ *[Ozen.Bot]* ${targets.length} membre(s) promu(s) administrateur :\n${list}`,
            mentions: targets
        });

        console.log(`[Ozen.Bot] ⬆️ Promote exécuté — ${targets.length} membre(s) promu(s)`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur promote :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de la promotion. Vérifie mes permissions.'
        });
    }
}