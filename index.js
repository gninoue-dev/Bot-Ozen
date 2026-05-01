const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    getContentType,
    fetchLatestBaileysVersion,
    delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const readline = require("readline");
const { cm } = require("./framework/ozen");
const conf = require("./config");
const fs = require("fs");

// Numéros autorisés depuis config.js (nettoyés)
const AUTORISES = conf.proprietaire.map(n => n.replace(/[^0-9]/g, ""));

// Extraction du numéro depuis un JID WhatsApp
function extraireNum(jid) {
    if (!jid) return '';
    const sansAt = jid.split('@')[0];
    const parties = sansAt.split(':');
    if (parties.length === 1) return parties[0];
    const derniere = parties[parties.length - 1];
    if (derniere.length <= 3) return parties.slice(0, -1).join('');
    return parties.join('');
}

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        if (process.stdin.closed || !process.stdin.readable) {
            resolve(null); return;
        }
        rl.question(text, (answer) => { rl.close(); resolve(answer); });
    });
};

let modeConnexion = null;

async function startOzen() {
    const authPath = __dirname + '/auth';
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const zk = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false,
        // ✅ Nécessaire pour recevoir les statuts des contacts
        shouldIgnoreJid: () => false,
        getMessage: async () => ({ conversation: "" })
    });

    if (!zk.authState.creds.registered) {
        if (process.stdin.isTTY || process.env.SESSION_ID) {
            const mode = await question("Connexion :\n1. QR Code\n2. Pairing Code\nEntrez 1 ou 2 : ");
            modeConnexion = mode;
            if (mode === "2") {
                let phoneNumber = await question("📞 Numéro (ex: 22505XXXXXXXX) : ");
                if (!phoneNumber) return console.log("❌ Numéro manquant.");
                phoneNumber = phoneNumber.replace(/\D/g, '');
                if (phoneNumber.length === 10 && !phoneNumber.startsWith('225')) phoneNumber = '225' + phoneNumber;
                console.log("📱 Numéro utilisé : " + phoneNumber);
                await delay(1000);
                try {
                    const code = await zk.requestPairingCode(phoneNumber);
                    console.log(`\n🌀 Code OZEN-MD : ${code}`);
                    console.log("⚠️ Entrez ce code sur votre téléphone dans les 60 secondes!");
                } catch (err) {
                    console.error("❌ Erreur pairing:", err.message); return;
                }
            }
        }
    }

    console.log("🌊 Chargement des modules Ozen-MD...");
    if (fs.existsSync("./plugins")) {
        fs.readdirSync("./plugins").forEach(file => {
            if (file.endsWith(".js")) require("./plugins/" + file);
        });
    }

    zk.ev.on("creds.update", saveCreds);

    zk.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && modeConnexion === "1") {
            console.log("📸 Scannez le QR Code :");
            qrcode.generate(qr, { small: true });
        }
        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) startOzen();
            else console.log("❌ Déconnecté définitivement.");
        } else if (connection === "open") {
            console.log(`✅ OZEN-MD connecté !`);
            console.log(`🔐 Numéros autorisés : ${AUTORISES.join(", ")}`);
            console.log(`👁️  Visionnage automatique des statuts : ACTIVÉ`);
        }
    });

    // ── VISIONNAGE AUTOMATIQUE DES STATUTS ──────────────────────────────
    // Dès qu'un contact publie un statut, le bot le visionne automatiquement
    zk.ev.on("messages.upsert", async (m) => {
        try {
            for (const msg of m.messages) {
                // Les statuts arrivent dans le JID spécial "status@broadcast"
                if (msg.key.remoteJid !== "status@broadcast") continue;
                if (!msg.message) continue;

                const expediteur = msg.key.participant || msg.key.remoteJid;
                const num = extraireNum(expediteur);

                // Marquer le statut comme vu
                await zk.readMessages([msg.key]);

                console.log(`👁️  Statut visionné : +${num}`);
            }
        } catch (e) {
            // Silencieux pour ne pas spammer la console
        }
    });

    zk.ev.on("messages.upsert", async (m) => {
        const ms = m.messages[0];
        if (!ms.message) return;

        const mtype = getContentType(ms.message);
        const texte = (mtype === 'conversation') ? ms.message.conversation :
                      (mtype === 'extendedTextMessage') ? ms.message.extendedTextMessage.text :
                      (mtype === 'imageMessage') ? ms.message.imageMessage.caption :
                      (mtype === 'videoMessage') ? ms.message.videoMessage.caption : '';

        if (!texte || !texte.startsWith(conf.prefixe)) return;

        const dest = ms.key.remoteJid;
        const repondre = (txt) => zk.sendMessage(dest, { text: String(txt) }, { quoted: ms });

        // ── IDENTIFICATION DE L'AUTEUR ──────────────────────────────
        // fromMe = message envoyé depuis le téléphone connecté au bot
        // Dans ce cas, c'est FORCÉMENT l'owner → accès direct sans vérif
        const estFromMe = ms.key.fromMe;

        let auteurNum = '';
        if (estFromMe) {
            // C'est toi qui envoies → autorisé directement
            auteurNum = AUTORISES[0]; // ton numéro principal
        } else {
            // Message d'un autre → on extrait et on vérifie
            const jidBrut = ms.key.participant || ms.key.remoteJid || "";
            auteurNum = extraireNum(jidBrut);
        }

        // DEBUG — montre ce qui arrive
        console.log(`\n📩 Commande reçue: "${texte}" | fromMe: ${estFromMe} | auteur: ${auteurNum}`);

        // ── VÉRIFICATION D'ACCÈS ────────────────────────────────────
        const estAutorise = estFromMe || AUTORISES.includes(auteurNum.replace(/[^0-9]/g, ""));

        if (!estAutorise) {
            console.log(`🚫 Accès refusé pour: ${auteurNum}`);
            return repondre(`🚫 *ACCÈS REFUSÉ*\n\nCe bot est privé.\n_OZEN-MD_`);
        }

        console.log(`✅ Accès accordé pour: ${auteurNum}`);

        const arg = texte.slice(conf.prefixe.length).trim().split(/ +/);
        const command = arg.shift().toLowerCase();
        const cmd = cm.find(c => c.nomCom === command || (c.alias && c.alias.includes(command)));
        if (!cmd) return;

        const auteurMessage = auteurNum + "@s.whatsapp.net";
        const superUser = true;

        const verifGroupe = dest.endsWith("@g.us");
        let infosGroupe = null;
        let verifAdmin = false;

        if (verifGroupe) {
            try {
                infosGroupe = await zk.groupMetadata(dest);
                const p = infosGroupe.participants.find(p => extraireNum(p.id) === auteurNum);
                verifAdmin = p?.admin === "admin" || p?.admin === "superadmin";
            } catch (e) {}
        }

        const contextInfo = ms.message[mtype]?.contextInfo;
        const msgRepondu = contextInfo?.quotedMessage || null;
        const auteurMsgRepondu = contextInfo?.participant
            ? extraireNum(contextInfo.participant) + "@s.whatsapp.net" : null;

        const options = {
            ms, arg, repondre, mtype, prefixe: conf.prefixe,
            verifGroupe, verifAdmin, infosGroupe,
            nomGroupe: infosGroupe ? infosGroupe.subject : "",
            auteurMessage, msgRepondu, auteurMsgRepondu, superUser
        };

        try {
            await zk.sendMessage(dest, { react: { text: cmd.reaction || "🌀", key: ms.key } });
            await cmd.fonction(dest, zk, options);
        } catch (e) {
            console.error("Erreur plugin :", e.message);
            repondre("❌ Erreur : " + e.message);
        }
    });
}

startOzen().catch(e => console.log("Erreur critique : " + e.message));
