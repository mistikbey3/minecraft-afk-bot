const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// --- WEB MASKESİ ---
app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.send(`<h2>System Status: ONLINE</h2><p>Uptime: ${uptime}s</p>`);
});

app.listen(PORT, () => console.log(`[SYS] Web servisi port ${PORT} üzerinde aktif.`));

// --- AFK BOT ---
const BOT_CONFIG = {
    host: 'play.mc-block.com',
    port: 25565,
    username: 'mistikhanim',
    password: 'salakmustafa',
    version: '1.20.1' // Sunucu sürümünü manuel sabitledik
};

let bot;

function createBot() {
    console.log('[BOT] Sunucuya bağlanmaya çalışılıyor...');

    bot = mineflayer.createBot({
        host: BOT_CONFIG.host,
        port: BOT_CONFIG.port,
        username: BOT_CONFIG.username,
        version: BOT_CONFIG.version
    });

    bot.on('login', () => {
        console.log('[BOT] Sunucu ağ bağlantısı sağlandı (Login başarılı).');
    });

    bot.on('spawn', () => {
        console.log(`[BOT] ${BOT_CONFIG.username} olarak dünyada doğdu!`);
        
        setTimeout(() => {
            bot.chat(`/login ${BOT_CONFIG.password}`);
            console.log('[BOT] Login komutu gönderildi.');
        }, 3000);
    });

    bot.on('messagestr', (message) => {
        if (message.trim().length > 0) {
            console.log('[CHAT]:', message);
        }

        const msgLower = message.toLowerCase();
        if (msgLower.includes('/login') || msgLower.includes('giriş')) {
            bot.chat(`/login ${BOT_CONFIG.password}`);
        } else if (msgLower.includes('/register') || msgLower.includes('kayıt')) {
            bot.chat(`/register ${BOT_CONFIG.password} ${BOT_CONFIG.password}`);
        }
    });

    bot.on('kicked', (reason) => {
        console.log('[BOT] Sunucudan atıldı! Sebep:', reason);
    });

    bot.on('error', (err) => {
        console.log('[BOT] Bağlantı Hatası:', err);
    });

    bot.on('end', (reason) => {
        console.log(`[BOT] Bağlantı koptu (${reason}). 20s sonra tekrar denenecek...`);
        setTimeout(createBot, 20000);
    });
}

createBot();
