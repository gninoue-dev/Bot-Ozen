import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import ffmpeg from "fluent-ffmpeg";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function createSticker(sock, groupJid, message) {
    try {
        // 1. Récupérer le message (direct ou cité)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = quoted || message.message;
        
        const isImage = msg?.imageMessage;
        const isVideo = msg?.videoMessage;

        if (!isImage && !isVideo) {
            return await sock.sendMessage(groupJid, { text: "❌ Veuillez citer une image ou une vidéo." });
        }

        const mediaData = isImage ? msg.imageMessage : msg.videoMessage;
        const type = isImage ? "image" : "video";

        // 2. Téléchargement du média
        const stream = await downloadContentFromMessage(mediaData, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 3. Chemins temporaires
        const tmpInput = `./tmp_${Date.now()}.${isImage ? 'jpg' : 'mp4'}`;
        const tmpOutput = `./tmp_${Date.now()}.webp`;

        fs.writeFileSync(tmpInput, buffer);

        // 4. Conversion avec FFmpeg (Optimisé pour WhatsApp)
        ffmpeg(tmpInput)
            .inputOptions(["-t 10"]) // Limite à 10s pour les vidéos
            .complexFilter([
                "scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512"
            ])
            .on("end", async () => {
                // 5. Envoi du Sticker
                await sock.sendMessage(groupJid, { 
                    sticker: fs.readFileSync(tmpOutput) 
                });

                // Nettoyage des fichiers temporaires
                fs.unlinkSync(tmpInput);
                fs.unlinkSync(tmpOutput);
            })
            .on("error", (err) => {
                console.error(err);
                fs.unlinkSync(tmpInput);
            })
            .toFormat("webp")
            .save(tmpOutput);

    } catch (error) {
        console.error("Erreur Sticker :", error);
        await sock.sendMessage(groupJid, { text: "❌ Erreur lors de la création du sticker." });
    }
}