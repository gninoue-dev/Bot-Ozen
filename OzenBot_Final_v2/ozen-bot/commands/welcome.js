// ╔══════════════════════════════════════╗
// ║    Ozen.Bot — Message de Bienvenue   ║
// ╚══════════════════════════════════════╝

export async function handleWelcome(update, sock, config) {

    try {

        // ─── Uniquement quand quelqu'un rejoint ───────
        if (update.action !== 'add') return;
        if (!config.welcome) return;

        const groupJid = update.id;

        // ─── Récupérer les infos du groupe ───────────
        const groupMeta = await sock.groupMetadata(groupJid);
        const groupName = groupMeta.subject;

        // ─── Envoyer un message pour chaque nouveau membre ──
        for (const participant of update.participants) {

            const number = participant.split('@')[0];

            // Remplacer les variables dans le message
            const welcomeText = config.welcomeMessage
                .replace('{group}', groupName)
                .replace('{number}', number);

            await sock.sendMessage(groupJid, {
                text: welcomeText,
                mentions: [participant]
            });

            console.log(`[Ozen.Bot] 👋 Bienvenue envoyé à @${number} dans "${groupName}"`);
        }

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur welcome :', err);
    }
}
