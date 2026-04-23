// ╔══════════════════════════════════════╗
// ║   Ozen.Bot — Gestionnaire Messages   ║
// ╚══════════════════════════════════════╝

import { banMembers } from '../commands/ban.js';
import { addMembers } from '../commands/add.js';
import { promoteMembers } from '../commands/promote.js';
import { demoteMembers } from '../commands/demote.js';
import { tagAll } from '../commands/tagall.js';
import { groupInfo } from '../commands/info.js';
import { leaveGroup } from '../commands/leave.js';
import { ping } from '../commands/ping.js';
import { deleteMessage } from '../commands/delete.js';
import { handleAntiSpam, toggleAntiSpam } from '../commands/spam.js';
import { handleUrgence, stopUrgence } from '../commands/urgence.js';

// Fonction pour vérifier si l'utilisateur est admin du bot
function isBotAdmin(senderJid, config) {
    const admins = config.admins || [];
    // Comparaison avec et sans @s.whatsapp.net
    const normalizedSender = senderJid.replace('@s.whatsapp.net', '');
    return admins.some(admin => 
        admin.replace('@s.whatsapp.net', '') === normalizedSender
    );
}

export default async function handleMessage(msg, sock, config) {

    try {

        const message = msg.messages?.[0];
        if (!message) return;

        // ─── Extraire le texte du message ────────────
        const body =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            '';

        if (!body.startsWith(config.prefix)) {
            // Vérifier l'anti-spam pour les messages normaux
            const groupJid = message.key.remoteJid;
            if (groupJid.endsWith('@g.us')) {
                await handleAntiSpam(msg, sock, config);
            }
            return;
        }

        const groupJid  = message.key.remoteJid;
        const senderJid = message.key.participant || message.key.remoteJid;
        const isGroup   = groupJid.endsWith('@g.us');

        const args    = body.slice(config.prefix.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();

        console.log(`📨 [Ozen.Bot] Commande reçue : ${config.prefix}${command} | Groupe: ${isGroup}`);

        // ─── Routage des commandes ───────────────────
        switch (command) {

            // ── #ban ─────────────────────────────────
            case 'ban':
            case 'kick': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}ban* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await banMembers(sock, groupJid, mentioned, senderJid);
                break;
            }

            // ── #add ─────────────────────────────────
            case 'add': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}add* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await addMembers(sock, groupJid, mentioned, senderJid);
                break;
            }

            // ── #promote ─────────────────────────────
            case 'promote': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}promote* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteMembers(sock, groupJid, mentioned, senderJid);
                break;
            }

            // ── #demote ──────────────────────────────
            case 'demote': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}demote* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteMembers(sock, groupJid, mentioned, senderJid);
                break;
            }

            // ── #tagall ──────────────────────────────
            case 'tagall': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}tagall* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                await tagAll(sock, groupJid, senderJid, args);
                break;
            }

            // ── #info ─────────────────────────────────
            case 'info': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}info* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                await groupInfo(sock, groupJid);
                break;
            }

            // ── #leave ───────────────────────────────
            case 'leave': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}leave* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                await leaveGroup(sock, groupJid, senderJid);
                break;
            }

            // ── #ping ─────────────────────────────────
            case 'ping': {
                await ping(sock, groupJid);
                break;
            }

            // ── #delete ───────────────────────────────
            case 'delete': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}delete* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                await deleteMessage(sock, groupJid, senderJid, message);
                break;
            }

            // ── #spam ─────────────────────────────────
            case 'spam': {
                if (!isGroup) {
                    await sock.sendMessage(groupJid, {
                        text: `❌ *[Ozen.Bot]* La commande *${config.prefix}spam* fonctionne uniquement dans un groupe.`
                    });
                    return;
                }
                await toggleAntiSpam(sock, groupJid, senderJid, args, config);
                break;
            }

            // ── #urgence ──────────────────────────────
            case 'urgence': {
                if (!isBotAdmin(senderJid, config)) {
                    await sock.sendMessage(groupJid, {
                        text: '❌ *[Ozen.Bot]* Tu n\'es pas autorisé à utiliser cette commande.\nSeuls les *admins du bot* peuvent l\'utiliser.'
                    });
                    return;
                }
                await handleUrgence(sock, groupJid, senderJid, config);
                break;
            }

            // ── #stopUrgence ──────────────────────────
            case 'stopurgence':
            case 'stop': {
                if (!isBotAdmin(senderJid, config)) {
                    await sock.sendMessage(groupJid, {
                        text: '❌ *[Ozen.Bot]* Tu n\'es pas autorisé à utiliser cette commande.\nSeuls les *admins du bot* peuvent l\'utiliser.'
                    });
                    return;
                }
                await stopUrgence(sock, groupJid, senderJid, config);
                break;
            }

            // ── #commande pour afficher le menu du bot ─
            case 'menu': {
                await sock.sendMessage(groupJid, {
                    text:
`╔══════════════════════════════════╗
║     *🤖 Ozen.Bot v1.0*           ║
╚══════════════════════════════════╝

📌 *Préfixe :* ${config.prefix}

*👥 Gestion des membres :*
• *${config.prefix}add* @membre — Ajouter un membre
• *${config.prefix}ban* @membre — Expulser un membre
• *${config.prefix}kick* @membre — Alias de ban
• *${config.prefix}promote* @membre — Promouvoir admin
• *${config.prefix}demote* @membre — Rétrograder

*📢 Groupe :*
• *${config.prefix}tagall* — Mentionner tous
• *${config.prefix}info* — Infos du groupe
• *${config.prefix}leave* — Quitter le groupe

*🛠️ Outils :*
• *${config.prefix}ping* — Test de latence
• *${config.prefix}delete* — Supprimer un message
• *${config.prefix}spam on/off* — Anti-spam
*🚨 Urgence :*
• *${config.prefix}urgence* — Envoyer message d'urgence
• *${config.prefix}stopUrgence* — Arrêter l'urgence
_Ozen.Bot — Ton assistant WhatsApp_`
                });
                break;
            }

            default:
                break;
        }

    } catch (err) {
        console.error('❌ [Ozen.Bot] Erreur messageHandler :', err);
    }
}
