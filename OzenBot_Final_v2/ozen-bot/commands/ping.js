// ╔══════════════════════════════════════╗
// ║      Ozen.Bot — Commande #ping       ║
// ╚══════════════════════════════════════╝

export async function ping(sock, jid) {

    try {

        const start = Date.now();
        
        // Envoyer un message pour mesurer la latence
        const msg = await sock.sendMessage(jid, { text: '🏓 Pong!' });
        
        const latency = Date.now() - start;

        await sock.sendMessage(jid, {
            text: `╔══════════════════════════════════╗
║     *🏓 Pong!*                    ║
╚══════════════════════════════════╝

*Latence :* ${latence}ms

_Ozen.Bot — En ligne_`,
            quoted: msg
        });

        console.log(`[Ozen.Bot] 🏓 Ping exécuté — ${latence}ms`);

    } catch (err) {
        console.error('[Ozen.Bot] ❌ Erreur ping :', err);
        await sock.sendMessage(jid, {
            text: '❌ *[Ozen.Bot]* Erreur lors du ping.'
        });
    }
}