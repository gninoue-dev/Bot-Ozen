// ╔══════════════════════════════════════╗
// ║   Ozen.Bot — Gestionnaire Messages   ║
// ╚══════════════════════════════════════╝

import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { banMembers } from '../commands/ban.js';
import { addMembers } from '../commands/add.js';
import { promoteMembers } from '../commands/promote.js';
import { demoteMembers } from '../commands/demote.js';
import { tagAll } from '../commands/tagall.js';
import { groupInfo } from '../commands/info.js';
import { leaveGroup } from '../commands/leave.js';
import { ping } from '../commands/ping.js';
import { deleteMessage } from '../commands/delete.js';
import { handleAntiSpam, toggleAntiSpam } from '../commands/anti_spam.js';
import { handleUrgence, stopUrgence } from '../commands/spam.js'; 
import { vueUnique } from '../commands/vueunique.js';
import { createSticker } from '../commands/sticker.js';

/**
 * Vérifie si l'utilisateur est admin du bot (Normalisé)
 */
function isBotAdmin(senderJid, config) {
    if (!config.admins) return false;
    const normalizedSender = jidNormalizedUser(senderJid);
    return config.admins.some(admin => {
        const adminJid = admin.includes('@s.whatsapp.net') ? admin : `${admin}@s.whatsapp.net`;
        return jidNormalizedUser(adminJid) === normalizedSender;
    });
}

export default async function handleMessage(msg, sock, config) {
    try {
        const message = msg.messages?.[0];
        if (!message || !message.message || message.key.remoteJid === 'status@broadcast') return;

        // ─── Extraction du contenu textuel ───
        const body = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        ).trim();

        const groupJid = message.key.remoteJid;
        const isGroup = groupJid.endsWith('@g.us');
        const senderJid = message.key.participant || message.key.remoteJid;

        // ─── Analyse Anti-Spam ───
        if (!body.startsWith(config.prefix)) {
            if (isGroup) await handleAntiSpam(msg, sock, config);
            return;
        }

        // ─── Préparation Commande & Arguments ───
        const args = body.slice(config.prefix.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        if (!command) return;

        console.log(`📨 [Ozen.Bot] Commande : ${config.prefix}${command} par ${senderJid}`);

        /**
         * Helper pour extraire les cibles (Mentions + Numéros dans le texte)
         */
        const getTargets = () => {
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const numbers = args
                .filter(arg => arg.length >= 8 && /^\d+$/.test(arg))
                .map(num => num.includes('@s.whatsapp.net') ? num : `${num}@s.whatsapp.net`);
            return [...new Set([...mentions, ...numbers])];
        };

        // ─── Routage des commandes ───
        switch (command) {

            case 's':
            case 'sticker':
                await createSticker(sock, groupJid, message);
                break;

            case 'ban':
            case 'kick':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await banMembers(sock, groupJid, getTargets(), senderJid);
                break;

            case 'add':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await addMembers(sock, groupJid, getTargets(), senderJid);
                break;

            case 'promote':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await promoteMembers(sock, groupJid, getTargets(), senderJid);
                break;

            case 'demote':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await demoteMembers(sock, groupJid, getTargets(), senderJid);
                break;

            case 'tag':
            case 'tagall':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await tagAll(sock, groupJid, senderJid, args);
                break;

            case 'info':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await groupInfo(sock, groupJid);
                break;

            case 'leave':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await leaveGroup(sock, groupJid, senderJid);
                break;

            case 'ping':
                await ping(sock, groupJid);
                break;

            case 'del':
            case 'delete':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await deleteMessage(sock, groupJid, senderJid, message);
                break;

            case 'antispam':
                if (!isGroup) return await sock.sendMessage(groupJid, { text: "❌ Uniquement en groupe." });
                await toggleAntiSpam(sock, groupJid, senderJid, args, config);
                break;

            case 'urgence':
            case 'spam':
                if (!isBotAdmin(senderJid, config)) return;
                await handleUrgence(sock, groupJid, senderJid);
                break;

            case 'stop':
            case 'stopurgence':
                if (!isBotAdmin(senderJid, config)) return;
                await stopUrgence(sock, groupJid, senderJid);
                break;

            case 'vu':
                if (!isBotAdmin(senderJid, config)) return;
                await vueUnique(sock, groupJid, senderJid, message);
                break;

            case 'aide':
            case 'menu':
                const helpText = `╔══════════════════════════════════╗
║     *🤖 OZEN.BOT V2.0*           ║
╚══════════════════════════════════╝

📌 *Prefix :* ${config.prefix}

*🎨 MULTIMÉDIA :*
• ${config.prefix}s / sticker (répondre)

*👥 MODÉRATION :*
• ${config.prefix}add / kick [mention/num]
• ${config.prefix}promote / demote

*📢 GROUPE :*
• ${config.prefix}tagall [texte]
• ${config.prefix}info / leave

*🛠️ OUTILS :*
• ${config.prefix}ping / del
• ${config.prefix}antispam <on/off>
• ${config.prefix}vu (répondre)

*🚨 ADMIN :*
• ${config.prefix}urgence / stop

_Ozen.Bot — Ingénierie Logicielle_`;
                await sock.sendMessage(groupJid, { text: helpText });
                break;

            default:
                break;
        }

    } catch (err) {
        console.error('❌ [Ozen.Bot] Erreur Critique :', err);
    }
}