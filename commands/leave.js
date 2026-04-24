import { jidNormalizedUser } from '@whiskeysockets/baileys';

// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #leave      ║
// ╚══════════════════════════════════════╝

export async function leaveGroup(sock, groupJid, senderJid) {

    try {
        // 1. Récupération des données du groupe
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        
        // 2. Normalisation de l'ID de l'expéditeur
        const normalizedSender = jidNormalizedUser(senderJid);

        // 3. Vérification des permissions
        // On utilise find avec normalisation pour être sûr de trouver l'admin
        const senderInfo = participants.find(p => jidNormalizedUser(p.id) === normalizedSender);

        if (!senderInfo || !senderInfo.admin) {
            return await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* du groupe peuvent me demander de partir.'
            });
        }

        // 4. Message d'au revoir
        await sock.sendMessage(groupJid, {
            text: `👋 *[Ozen.Bot]* Au revoir !\nJe quitte le groupe *"${groupMeta.subject}"* à la demande de l'administrateur @${normalizedSender.split('@')[0]}.`,
            mentions: [normalizedSender]
        });

        // 5. Temporisation (2 secondes)
        // On attend que le message soit bien envoyé avant de couper la connexion au groupe
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 6. Sortie effective
        await sock.groupLeave(groupJid);

        console.log(`[Ozen.Bot] 👋 Sortie du groupe réussie : ${groupMeta.subject}`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur leave :', err);
    }
}