// ╔══════════════════════════════════════╗
// ║           Ozen.Bot  v2.0             ║
// ║    Bot WhatsApp multi-device         ║
// ╚══════════════════════════════════════╝

import { readFileSync } from 'fs';
import { startSession } from './utils/connector.js';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

console.log(`
╔══════════════════════════════╗
║        Ozen.Bot  v2.0        ║
║   Bot WhatsApp Multi-Device  ║
╚══════════════════════════════╝
`);

const number = config.number;

if (!number || number === 'TON_NUMERO_ICI') {
    console.error('❌ Configure ton numéro dans config.json avant de démarrer !');
    console.error('   Exemple : "number": "2250701234567"');
    process.exit(1);
}

console.log(`📱 Démarrage de la session pour : ${number}`);

startSession(number).catch(err => {
    console.error('❌ Erreur fatale :', err);
    process.exit(1);
});
