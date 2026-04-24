// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #ping       ║
// ╚══════════════════════════════════════╝

export async function ping(sock, jid) {

    try {
        const start = Date.now();
        
        // 1. Envoyer le message initial
        const msg = await sock.sendMessage(jid, { text: '🚀 Calcul de la latence...' });
        
        // 2. Calculer la différence de temps
        // Correction : Ton code utilisait "latence" au lieu de "latency" dans le texte
        const latency = Date.now() - start;

        // 3. Modifier le message ou répondre avec le résultat final
        const infoText = `╔══════════════════════════════════╗
║     *🏓 PONG !*                   ║
╚══════════════════════════════════╝

⚡ *Vitesse :* ${latency} ms
🤖 *Status :* Opérationnel
📡 *Serveur :* Stable

_Ozen.Bot — Ton assistant WhatsApp_`;

        await sock.sendMessage(jid, {
            text: infoText,
            edit: msg.key // Optionnel : tu peux modifier le message précédent au lieu d'en créer un nouveau
        });

        console.log(`[Ozen.Bot] 🏓 Ping : ${latency}ms`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur ping :', err);
        await sock.sendMessage(jid, {
            text: '❌ *[Ozen.Bot]* Erreur lors du test de latence.'
        });
    }
}