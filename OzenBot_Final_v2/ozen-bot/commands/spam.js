// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Anti-Spam            ║
// ╚══════════════════════════════════════╝

// Stockage temporaire des messages (en mémoire)
const userMessages = new Map();
const spamWarnings = new Map();

// Configuration anti-spam
const SPAM_LIMIT = 5;        // Messages max en 5 secondes
const SPAM_WINDOW = 5000;    // Fenêtre de 5 secondes
const WARN_TIMEOUT = 60000;  // Avertissement expire après 1 minute

export async function handleAntiSpam(msg, sock, config) {

    try {

        const message = msg.messages?.[0];
        if (!message) return;

        const groupJid = message.key.remoteJid;
        const senderJid = message.key.participant || message.key.remoteJid;
        const isGroup = groupJid.endsWith('@g.us');

        // Ignorer si pas dans un groupe ou si c'est le bot
        if (!isGroup || senderJid.includes('@s.whatsapp.net')) return;

        // Ignorer les commandes
        const body = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';
        if (body.startsWith(config.prefix)) return;

        // Nettoyer les anciens messages
        const now = Date.now();
        if (!userMessages.has(senderJid)) {
            userMessages.set(senderJid, []);
        }
        
        const messages = userMessages.get(senderJid);
        const recentMessages = messages.filter(t => now - t < SPAM_WINDOW);
        recentMessages.push(now);
        userMessages.set(senderJid, recentMessages);

        // Détection de spam
        if (recentMessages.length > SPAM_LIMIT) {
            
            // Ajouter un avertissement
            const warnings = spamWarnings.get(senderJid) || 0;
            spamWarnings.set(senderJid, warnings + 1);

            if (warnings >= 2) {
                // Expulser après 3 avertissements
                try {
                    const groupMeta = await sock.groupMetadata(groupJid);
                    const participants = groupMeta.participants;
                    const botJid = sock.user.id.replace(/:.*@/, '@');
                    
                    const botInfo = participants.find(p => p.id === botJid);
                    const isBotAdmin = botInfo && ['admin', 'superadmin'].includes(botInfo.admin);

                    if (isBotAdmin) {
                        await sock.groupParticipantsUpdate(groupJid, [senderJid], 'remove');
                        await sock.sendMessage(groupJid, {
                            text: `🚫 *[Ozen.Bot]* @${senderJid.split('@')[0]} a été expulsé pour spam.`,
                            mentions: [senderJid]
                        });
                        console.log(`[Ozen.Bot] 🔨 Spam détecté — ${senderJid} expulsé`);
                    }
                } catch (err) {
                    console.error('[Ozen.Bot] Erreur expulsion spam:', err);
                }
                
                spamWarnings.delete(senderJid);
                userMessages.delete(senderJid);
                
            } else {
                // Avertir
                await sock.sendMessage(groupJid, {
                    text: `⚠️ *[Ozen.Bot]* @${senderJid.split('@')[0]} spam détecté !\nTrop de messages rapides. (${warnings + 1}/3)`,
                    mentions: [senderJid]
                });
                console.log(`[Ozen.Bot] ⚠️ Spam détecté — Avertissement ${warnings + 1} pour ${senderJid}`);
            }

            // Nettoyer après avertissement
            userMessages.delete(senderJid);
        }

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur anti-spam:', err);
    }
}

// Fonction pour activer/désactiver l'anti-spam
export async function toggleAntiSpam(sock, groupJid, senderJid, args, config) {

    try {
        const groupMeta = await sock.groupMetadata(groupJid);
        const participants = groupMeta.participants;
        const botJid = sock.user.id.replace(/:.*@/, '@');

        // Vérifier si l'expéditeur est admin
        const senderInfo = participants.find(p => p.id === senderJid);
        if (!senderInfo || !['admin', 'superadmin'].includes(senderInfo.admin)) {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Seuls les *administrateurs* peuvent utiliser cette commande.'
            });
            return;
        }

        const action = args[0]?.toLowerCase();
        
        if (action === 'on') {
            await sock.sendMessage(groupJid, {
                text: '✅ *[Ozen.Bot]* Anti-spam *activé* dans ce groupe.'
            });
            console.log(`[Ozen.Bot] Anti-spam activé dans ${groupJid}`);
        } else if (action === 'off') {
            await sock.sendMessage(groupJid, {
                text: '❌ *[Ozen.Bot]* Anti-spam *désactivé* dans ce groupe.'
            });
            console.log(`[Ozen.Bot] Anti-spam désactivé dans ${groupJid}`);
        } else {
            await sock.sendMessage(groupJid, {
                text: `⚠️ *[Ozen.Bot]* Usage : *${config.prefix}spam on* ou *${config.prefix}spam off*`
            });
        }

    } catch (err) {
        console.error('[Ozen.Bot] Erreur toggle anti-spam:', err);
    }
}