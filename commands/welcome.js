// ╔══════════════════════════════════════╗
// ║    Ozen.Bot — Message de Bienvenue   ║
// ╚══════════════════════════════════════╝

export async function handleWelcome(update, sock) {
    try {
        // 1. Détection de l'action "add" (nouveaux membres)
        if (update.action !== 'add') return;

        const groupJid = update.id;
        
        // 2. Récupérer les métadonnées du groupe (Nom, Description, etc.)
        const groupMeta = await sock.groupMetadata(groupJid);
        const groupName = groupMeta.subject;

        // 3. Préparer la liste des nouveaux participants
        const participants = update.participants; // Tableau de JIDs
        
        // Construction d'une chaîne de caractères pour citer tout le monde d'un coup
        const mentionsList = participants.map(p => `@${p.split('@')[0]}`).join(', ');

        // 4. Message de bienvenue personnalisé
        // Note : On peut ajouter des variables comme {desc} pour la description
        const text = `🌟 *BIENVENUE DANS LE GROUPE* 🌟\n\n` +
                     `Salut ${mentionsList} !\n` +
                     `Heureux de vous voir dans *${groupName}*.\n\n` +
                     `📌 *Description du groupe :*\n${groupMeta.desc || "Pas de description."}\n\n` +
                     `_Ozen.Bot — À votre service_`;

        // 5. Tentative d'envoi avec la photo de profil du groupe pour faire "pro"
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(groupJid, 'image');
        } catch {
            ppUrl = null;
        }

        if (ppUrl) {
            await sock.sendMessage(groupJid, {
                image: { url: ppUrl },
                caption: text,
                mentions: participants
            });
        } else {
            await sock.sendMessage(groupJid, {
                text: text,
                mentions: participants
            });
        }

        console.log(`[Ozen.Bot] 👋 Bienvenue envoyé pour ${participants.length} membre(s).`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur welcome :', err);
    }
}