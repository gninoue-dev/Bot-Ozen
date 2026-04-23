// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #info       ║
// ╚══════════════════════════════════════╝

export async function groupInfo(sock, groupJid) {

    try {

        const groupMeta = await sock.groupMetadata(groupJid);
        
        // Compter les admins et membres
        const admins = groupMeta.participants.filter(p => 
            p.admin === 'admin' || p.admin === 'superadmin'
        );
        const members = groupMeta.participants.filter(p => !p.admin);
        
        // Description du groupe
        const desc = groupMeta.desc || 'Aucune description';
        
        // Date de création (si disponible)
        const created = groupMeta.creation ? new Date(groupMeta.creation * 1000).toLocaleDateString() : 'Inconnue';

        const infoText = `╔══════════════════════════════════╗
║     *📊 Info Groupe*              ║
╚══════════════════════════════════╝

*Nom :* ${groupMeta.subject}

*Membres :* ${groupMeta.participants.length}
• Administrateurs : ${admins.length}
• Membres : ${members.length}

*Description :*
${desc.substring(0, 200)}${desc.length > 200 ? '...' : ''}

*Créé le :* ${created}

_Ozen.Bot — Ton assistant WhatsApp_`;

        await sock.sendMessage(groupJid, { text: infoText });

        console.log(`[Ozen.Bot] 📊 Info groupe envoyé pour "${groupMeta.subject}"`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur info :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Erreur lors de la récupération des infos.'
        });
    }
}