// ╔══════════════════════════════════════╗
// ║     Ozen.Bot — Connexion WhatsApp    ║
// ╚══════════════════════════════════════╝

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

import { readFileSync, existsSync, mkdirSync } from 'fs';
import pino from 'pino';
import handleMessage from '../events/messageHandler.js';
import { handleWelcome } from '../commands/welcome.js';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

export async function startSession(number) {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = `./sessions/${cleanNumber}`;

    if (!existsSync(sessionPath)) {
        mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: true,
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log(`🔄 [Ozen.Bot] Reconnexion dans 5s (Code: ${code})...`);
                setTimeout(() => startSession(cleanNumber), 5000);
            } else {
                console.log('❌ [Ozen.Bot] Session terminée.');
            }
        } else if (connection === 'open') {
            console.log(`✅ [Ozen.Bot] Connecté ! Numéro : ${cleanNumber}`);
            console.log(`📌 Préfixe : ${config.prefix}`);
            console.log('─────────────────────────────────');
        }
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                if (!sock.authState.creds.registered) {
                    const code = await sock.requestPairingCode(cleanNumber);
                    console.log('\n┌─────────────────────────────────┐');
                    console.log(`│  📲 PAIRING CODE : ${code}  │`);
                    console.log('└─────────────────────────────────┘\n');
                }
            } catch (err) {
                console.error('❌ Erreur Pairing Code :', err.message);
            }
        }, 5000);
    }

    // ─── Événements & Auto-Read Status ──────────────
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message) return;

        // 1. Détection et lecture automatique des statuts
        if (message.key.remoteJid === 'status@broadcast') {
            await sock.readMessages([message.key]);
            const sender = message.key.participant ? message.key.participant.split('@')[0] : 'Inconnu';
            console.log(`👁️  Statut vu pour : ${sender}`);
            return; // On arrête le traitement ici pour les statuts
        }

        // 2. Traitement des messages classiques
        if (msg.type !== 'notify') return;
        await handleMessage(msg, sock, config);
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleWelcome(update, sock, config);
    });

    return sock;
}