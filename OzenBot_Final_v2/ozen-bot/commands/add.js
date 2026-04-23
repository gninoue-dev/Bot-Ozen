// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #add        ║
// ╚══════════════════════════════════════╝

export async function addMembers(sock, groupJid, targets, senderJid) {

    try {

        // ─── Récupérer les infos du groupe ───────────
        const groupMeta    = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid       = sock.user.id.replace(/:.*@/, '@');

        // ─── Vérifier que le bot est admin ───────────
        const botInfo = participants.find(p => p.id === botJid);
        if (!botInfo || !['admin', 'superadmin'].includes(botInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Je dois être *administrateur* pour ajouter des membres.'
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
                text: `⚠️ *[Ozen.Bot]* Mentionne un numéro à ajouter.\nEx : *${config.prefix}add @membre* ou *${config.prefix}add 2250100000000*`
            });
            return;
        }

        // ─── Ajouter les membres ─────────────────────
        await sock.groupParticipantsUpdate(groupJid, targets, 'add');

        // ─── Message de confirmation ─────────────────
        const list = targets.map(jid => `• @${jid.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupJid, {
            text: `✅ *[Ozen.Bot]* ${targets.length} membre(s) ajouté(s) :\n${list}`,
            mentions: targets
        });

        console.log(`[Ozen.Bot] ➕ Add exécuté — ${targets.length} membre(s) ajouté(s)`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur add :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de l\'ajout. Vérifie mes permissions.'
        });
    }
}