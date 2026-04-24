// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #info       ║
// ╚══════════════════════════════════════╝

export async function groupInfo(sock, groupJid) {

    try {
        // 1. Récupérer les métadonnées complètes
        const groupMeta = await sock.groupMetadata(groupJid);
        
        // 2. Calcul des statistiques
        const admins = groupMeta.participants.filter(p => 
            p.admin === 'admin' || p.admin === 'superadmin'
        );
        const membersCount = groupMeta.participants.length;
        
        // 3. Identification du créateur (owner)
        // Note: groupMeta.owner est l'ID du créateur du groupe
        const owner = groupMeta.owner || "Inconnu";
        
        // 4. Formatage de la date
        const created = groupMeta.creation 
            ? new Date(groupMeta.creation * 1000).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'long', year: 'numeric' 
              }) 
            : 'Inconnue';

        // 5. Construction du texte
        const infoText = `╔══════════════════════════════════╗
║     *📊 STATISTIQUES GROUPE*      ║
╚══════════════════════════════════╝

📌 *Nom :* ${groupMeta.subject}
🆔 *ID :* ${groupJid.split('@')[0]}
📅 *Création :* ${created}
👑 *Créateur :* @${owner.split('@')[0]}

👥 *Membres :* ${membersCount}
• Admins : ${admins.length}
• Utilisateurs : ${membersCount - admins.length}

📝 *Description :*
${groupMeta.desc ? groupMeta.desc : 'Aucune description.'}

_Ozen.Bot — Assistant WhatsApp_`;

        // 6. Tentative de récupération de la photo de profil
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(groupJid, 'image');
        } catch (e) {
            // Pas de photo ou erreur de permission
            ppUrl = null;
        }

        // 7. Envoi (avec image si possible, sinon texte seul)
        if (ppUrl) {
            await sock.sendMessage(groupJid, { 
                image: { url: ppUrl }, 
                caption: infoText,
                mentions: [owner]
            });
        } else {
            await sock.sendMessage(groupJid, { 
                text: infoText,
                mentions: [owner]
            });
        }

        console.log(`[Ozen.Bot] 📊 Info envoyé : ${groupMeta.subject}`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur info :', err);
        await sock.sendMessage(groupJid, {
            text: '❌ *[Ozen.Bot]* Impossible de récupérer les informations du groupe.'
        });
    }
}