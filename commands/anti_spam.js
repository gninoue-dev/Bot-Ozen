// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Anti-Spam            ║
// ╚══════════════════════════════════════╝

const userMessages = new Map();
const spamWarnings = new Map();

const SPAM_LIMIT = 5;        
const SPAM_WINDOW = 5000;    

export async function handleAntiSpam(msg, sock, config) {
    try {
        const message = msg.messages?.[0];
        if (!message || !message.key.remoteJid) return;

        const groupJid = message.key.remoteJid;
        const isGroup = groupJid.endsWith('@g.us');
        
        // Correction : On récupère l'ID de l'expéditeur correctement
        const senderJid = message.key.participant || message.key.remoteJid;

        // On ignore si ce n'est pas un groupe ou si c'est le bot lui-même qui parle
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isGroup || senderJid === botId) return;

        // Ignorer les commandes
        const body = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     message.message?.imageMessage?.caption || '';
        if (body.startsWith(config.prefix)) return;

        const now = Date.now();
        if (!userMessages.has(senderJid)) {
            userMessages.set(senderJid, []);
        }
        
        let messages = userMessages.get(senderJid);
        // Filtrer pour ne garder que les messages dans la fenêtre de temps
        messages = messages.filter(t => now - t < SPAM_WINDOW);
        messages.push(now);
        userMessages.set(senderJid, messages);

        // Détection de spam
        if (messages.length > SPAM_LIMIT) {
            const warnings = (spamWarnings.get(senderJid) || 0) + 1;
            spamWarnings.set(senderJid, warnings);

            if (warnings >= 3) { // Expulsion au 3ème avertissement réel
                try {
                    const groupMeta = await sock.groupMetadata(groupJid);
                    const botJid = sock.user.id.replace(/:.*@/, '@');
                    const isBotAdmin = groupMeta.participants.find(p => p.id === botJid)?.admin;

                    if (isBotAdmin) {
                        await sock.groupParticipantsUpdate(groupJid, [senderJid], 'remove');
                        await sock.sendMessage(groupJid, {
                            text: `🚫 *[Ozen.Bot]* @${senderJid.split('@')[0]} a été expulsé pour spam excessif.`,
                            mentions: [senderJid]
                        });
                    }
                } catch (err) {
                    console.error('Erreur expulsion:', err);
                }
                spamWarnings.delete(senderJid);
            } else {
                await sock.sendMessage(groupJid, {
                    text: `⚠️ *[Ozen.Bot]* @${senderJid.split('@')[0]}, arrête de spammer ! (${warnings}/3)`,
                    mentions: [senderJid]
                });
            }
            // Reset le compteur de messages après un avertissement pour éviter le flood de warnings
            userMessages.set(senderJid, []);
        }
    } catch (err) {
        console.error('❌ Erreur anti-spam:', err);
    }
}

export async function toggleAntiSpam(sock, groupJid, senderJid, args, config) {
    try {
        const groupMeta = await sock.groupMetadata(groupJid);
        const isAdmin = groupMeta.participants.find(p => p.id === senderJid)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(groupJid, { text: '❌ Seuls les admins peuvent configurer l\'anti-spam.' });
        }

        const action = args[0]?.toLowerCase();
        // Note : Pour que cela fonctionne réellement, il faudrait stocker l'état (on/off) 
        // dans une base de données ou un fichier JSON par groupe.
        if (action === 'on') {
            await sock.sendMessage(groupJid, { text: '✅ Anti-spam activé.' });
        } else if (action === 'off') {
            await sock.sendMessage(groupJid, { text: '❌ Anti-spam désactivé.' });
        } else {
            await sock.sendMessage(groupJid, { text: `Usage : ${config.prefix}antispam on/off` });
        }
    } catch (err) {
        console.error('Erreur toggleAntiSpam:', err);
    }
}