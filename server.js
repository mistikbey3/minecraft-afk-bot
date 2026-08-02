const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 3000;

// Sunucunun çalışma süresini takip etmek için
const startTime = Date.now();

// --- 1. MASKELENMİŞ WEB SUNUCUSU (RENDER İÇİN UPTIME) ---
app.get('/', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Service Status</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #fff; text-align: center; padding-top: 50px; }
                .card { background: #1e1e1e; display: inline-block; padding: 20px 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                .status { color: #4caf50; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>System Health Monitor</h2>
                <p>Status: <span class="status">ONLINE</span></p>
                <p>Uptime: ${uptimeSeconds} seconds</p>
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`[SYS] Web servisi ${PORT} portunda aktif.`);
});

// --- 2. AFK BOT YAPILANDIRMASI (MC-BLOCK) ---
const BOT_CONFIG = {
    host: 'play.mc-block.com',
    port: 25565,
    username: 'mistikhanim',
    password: 'salakmustafa'
};

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: BOT_CONFIG.host,
        port: BOT_CONFIG.port,
        username: BOT_CONFIG.username,
        version: false // Sunucu sürümünü otomatik algılar
    });

    // Oyuna başarıyla doğduğunda
    bot.on('spawn', () => {
        console.log(`[BOT] ${BOT_CONFIG.username} olarak ${BOT_CONFIG.host} sunucusuna giriş yapıldı.`);
        
        // Sunucuya doğduktan 3 saniye sonra otomatik login komutu gönder
        setTimeout(() => {
            bot.chat(`/login ${BOT_CONFIG.password}`);
        }, 3000);
    });

    // Sohbet mesajlarını dinleme & Otomatik Giriş / Kayıt
    bot.on('messagestr', (message) => {
        if (message.trim().length > 0) {
            console.log('[CHAT]:', message);
        }

        const msgLower = message.toLowerCase();

        // Giriş yap uyarısı gelirse
        if (msgLower.includes('/login') || msgLower.includes('giriş') || msgLower.includes('/giris')) {
            bot.chat(`/login ${BOT_CONFIG.password}`);
        } 
        // Kayıt ol uyarısı gelirse
        else if (msgLower.includes('/register') || msgLower.includes('kayıt') || msgLower.includes('/kayit')) {
            bot.chat(`/register ${BOT_CONFIG.password} ${BOT_CONFIG.password}`);
        }
    });

    // Bağlantı kopması durumunda (Render CPU şişmesini önleyen 20s gecikmeli yapı)
    bot.on('end', (reason) => {
        console.log(`[BOT] Bağlantı kesildi (${reason}). 20 saniye sonra tekrar deneniyor...`);
        setTimeout(createBot, 20000);
    });

    bot.on('error', (err) => {
        console.log('[BOT] Hata oluştu:', err.message);
    });
}

// Botu başlat
createBot();
