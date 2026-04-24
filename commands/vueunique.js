import { downloadContentFromMessage, jidNormalizedUser } from "@whiskeysockets/baileys";

/**
 * Récupère le contenu d'un message à vue unique.
 */
export async function vueUnique(sock, groupJid, senderJid, message) {
    try {
        // 1. Extraire le message cité (quoted)
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await sock.sendMessage(groupJid, { text: "❌ Répondez à un message à vue unique pour le récupérer." });
        }

        // 2. Normalisation des IDs
        const normalizedSender = jidNormalizedUser(senderJid);
        const authorJid = jidNormalizedUser(contextInfo.participant || senderJid);

        // 3. Localiser l'objet média dans la structure ViewOnce
        // On vérifie toutes les versions possibles de l'encapsulation ViewOnce
        const viewOnceContent = quoted.viewOnceMessageV2?.message || 
                             quoted.viewOnceMessage?.message || 
                             quoted.viewOnceMessageV2Extension?.message || 
                             quoted; // Cas où c'est déjà le message interne

        const mediaType = Object.keys(viewOnceContent)[0]; // ex: 'imageMessage' ou 'videoMessage'
        
        if (!['imageMessage', 'videoMessage'].includes(mediaType)) {
            return await sock.sendMessage(groupJid, { text: "❌ Le message cité n'est pas une image ou une vidéo à vue unique." });
        }

        const mediaData = viewOnceContent[mediaType];

        // 4. Téléchargement du contenu
        const stream = await downloadContentFromMessage(mediaData, mediaType.replace('Message', ''));
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 5. Configuration de la destination
        // Assure-toi que ce numéro est au format international correct
        const monNumero = "2250103508128@s.whatsapp.net"; 
        const typeNom = mediaType === 'imageMessage' ? 'Photo' : 'Vidéo';
        
        const caption = `⚠️ *RÉCUPÉRATEUR OZEN.BOT*\n\n` +
                        `👤 *Auteur :* @${authorJid.split('@')[0]}\n` +
                        `📂 *Type :* ${typeNom}\n` +
                        `🕒 *Heure :* ${new Date().toLocaleTimeString()}`;

        // 6. Envoi vers ton numéro privé
        const options = {
            [mediaType === 'imageMessage' ? 'image' : 'video']: buffer,
            caption: caption,
            mentions: [authorJid]
        };

        await sock.sendMessage(monNumero, options);

        // 7. Confirmation dans le groupe
        await sock.sendMessage(groupJid, { text: "✅ Média récupéré et envoyé en privé." });

    } catch (err) {
        console.error("❌ [Ozen.Bot] Erreur vueUnique :", err);
        await sock.sendMessage(groupJid, { text: "❌ Erreur technique (Média peut-être déjà expiré ou indisponible)." });
    }
}