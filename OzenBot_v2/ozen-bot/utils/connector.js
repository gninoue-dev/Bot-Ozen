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

    const sessionPath = `./sessions/${number}`;

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
        markOnlineOnConnect: false,
        syncFullHistory: false
    });

    // ─── Sauvegarde des credentials ────────────────
    sock.ev.on('creds.update', saveCreds);

    // ─── Gestion de la connexion ────────────────────
    sock.ev.on('connection.update', async (update) => {

        const { connection, lastDisconnect } = update;

        if (connection === 'close') {

            const code = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log('🔄 [Ozen.Bot] Reconnexion en cours...');
                startSession(number);
            } else {
                console.log('❌ [Ozen.Bot] Session déconnectée. Supprime le dossier sessions/ et relance.');
            }

        } else if (connection === 'open') {
            console.log(`✅ [Ozen.Bot] Connecté avec succès ! Numéro : ${number}`);
            console.log(`📌 Préfixe des commandes : ${config.prefix}`);
            console.log('─────────────────────────────────');
        }
    });

    // ─── Demande du Pairing Code (si pas encore lié) ─
    setTimeout(async () => {

        if (!state.creds.registered) {
            try {
                const code = await sock.requestPairingCode(number);
                console.log('');
                console.log('┌─────────────────────────────────┐');
                console.log(`│  📲 PAIRING CODE : ${code}  │`);
                console.log('└─────────────────────────────────┘');
                console.log('👉 WhatsApp → Paramètres → Appareils connectés');
                console.log('   → Connecter un appareil → Numéro de téléphone');
                console.log('');
            } catch (err) {
                console.error('❌ Erreur pairing code :', err.message);
            }
        }

    }, 3000);

    // ─── Messages entrants ──────────────────────────
    sock.ev.on('messages.upsert', async (msg) => {
        await handleMessage(msg, sock, config);
    });

    // ─── Nouveaux membres dans un groupe (Welcome) ──
    sock.ev.on('group-participants.update', async (update) => {
        await handleWelcome(update, sock, config);
    });

    return sock;
}
