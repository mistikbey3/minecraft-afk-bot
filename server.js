const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Geçmiş chat ve log mesajlarını tutan hafıza alanı
let chatLogs = [];
let botStatus = 'Başlatılıyor...';

function addLog(msg) {
    const time = new Date().toLocaleTimeString('tr-TR');
    chatLogs.push(`[${time}] ${msg}`);
    if (chatLogs.length > 50) chatLogs.shift(); // Son 50 mesajı tutar
}

// --- CANLI CHAT PANELLİ WEB DASHBOARD ---
app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>MC Client & Web Dashboard</title>
            <style>
                body { background-color: #0d1117; color: #c9d1d9; font-family: monospace, sans-serif; margin: 0; padding: 20px; }
                .container { max-width: 900px; margin: 0 auto; }
                .card { background: #161b22; border-radius: 8px; padding: 20px; border: 1px solid #30363d; margin-bottom: 20px; }
                .status { color: #58a6ff; font-weight: bold; }
                .online { color: #3fb950; }
                .error { color: #f85149; }
                .chat-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 15px; height: 350px; overflow-y: auto; font-size: 13px; line-height: 1.6; color: #8b949e; }
                .log-entry { margin-bottom: 4px; border-bottom: 1px solid #21262d; padding-bottom: 2px; }
                h2 { margin-top: 0; color: #f0f6fc; font-size: 18px; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <h2>SYSTEM & BOT STATUS</h2>
                    <p><strong>Durum:</strong> <span class="status ${botStatus.includes('OYUNDA') ? 'online' : ''}">${botStatus}</span></p>
                    <p><strong>Uptime:</strong> ${uptime} saniye</p>
                    <p><strong>Sunucu:</strong> play.mc-block.com | <strong>Hesap:</strong> mistikhanim</p>
                </div>
                <div class="card">
                    <h2>OYUN İÇİ CHAT & KONSOL LOGLARI</h2>
                    <div class="chat-box" id="chatBox">
                        ${chatLogs.map(log => `<div class="log-entry">${log}</div>`).reverse().join('') || '<div class="log-entry">Henüz mesaj yok...</div>'}
                    </div>
                </div>
            </div>
            <script>
                // Sayfayı her 4 saniyede bir otomatik yenileyip canlı chati getirir
                setTimeout(() => { location.reload(); }, 4000);
            </script>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', botStatus, uptime: Math.floor((Date.now() - startTime) / 1000) });
});

app.listen(PORT, () => {
    console.log(`[SYS] Web servisi port ${PORT} üzerinde aktif.`);
    addLog('Web arayüzü başlatıldı.');
});

// --- AFK BOT YAPILANDIRMASI ---
const BOT_CONFIG = {
    host: 'play.mc-block.com',
    port: 25565,
    username: 'mistikhanim',
    password: 'salakmustafa',
    version: '1.20.1'
};

let bot;

function createBot() {
    botStatus = 'Sunucuya Bağlanıyor...';
    addLog('play.mc-block.com sunucusuna bağlanılıyor...');

    bot = mineflayer.createBot({
        host: BOT_CONFIG.host,
        port: BOT_CONFIG.port,
        username: BOT_CONFIG.username,
        version: BOT_CONFIG.version
    });

    bot.on('login', () => {
        botStatus = 'Bağlandı (Giriş Bekleniyor)';
        addLog('Sunucuya ağ bağlantısı sağlandı.');
    });

    bot.on('spawn', () => {
        botStatus = 'OYUNDA (AFK)';
        addLog(`${BOT_CONFIG.username} olarak dünyada doğdu!`);
        
        setTimeout(() => {
            bot.chat(`/login ${BOT_CONFIG.password}`);
            addLog('Otomatik /login komutu gönderildi.');
        }, 3000);
    });

    bot.on('messagestr', (message) => {
        if (message.trim().length > 0) {
            console.log('[CHAT]:', message);
            addLog(`[CHAT] ${message}`);
        }

        const msgLower = message.toLowerCase();
        if (msgLower.includes('/login') || msgLower.includes('giriş')) {
            bot.chat(`/login ${BOT_CONFIG.password}`);
        } else if (msgLower.includes('/register') || msgLower.includes('kayıt')) {
            bot.chat(`/register ${BOT_CONFIG.password} ${BOT_CONFIG.password}`);
        }
    });

    bot.on('kicked', (reason) => {
        botStatus = 'Sunucudan Atıldı';
        addLog(`[UYARI] Sunucudan atıldı! Sebep: ${reason}`);
    });

    bot.on('error', (err) => {
        botStatus = 'Hata Oluştu';
        addLog(`[HATA] ${err.message}`);
    });

    bot.on('end', (reason) => {
        botStatus = 'Bağlantı Koptu';
        addLog(`Bağlantı koptu (${reason}). 20s sonra tekrar deneniyor...`);
        setTimeout(createBot, 20000);
    });
}

// Botu başlat
createBot();
