const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

let chatLogs = [];
let botStatus = 'Başlatılıyor...';
let bot = null;
let isLoggedIn = false; // Çift login atılmasını önleyen kilit

function addLog(msg) {
    const time = new Date().toLocaleTimeString('tr-TR');
    chatLogs.push(`[${time}] ${msg}`);
    if (chatLogs.length > 50) chatLogs.shift();
}

// --- CANLI CHAT VE MESAJ GÖNDERMELİ WEB DASHBOARD ---
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
                .chat-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 15px; height: 320px; overflow-y: auto; font-size: 13px; line-height: 1.6; color: #8b949e; margin-bottom: 15px; }
                .log-entry { margin-bottom: 4px; border-bottom: 1px solid #21262d; padding-bottom: 2px; }
                h2 { margin-top: 0; color: #f0f6fc; font-size: 18px; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
                .input-group { display: flex; gap: 10px; }
                input[type="text"] { flex: 1; background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; }
                button { background: #238636; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; }
                button:hover { background: #2ea043; }
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
                    <!-- SİTEDEN OYUNA MESAJ / KOMUT GÖNDERME KUTUSU -->
                    <form action="/send" method="POST" class="input-group">
                        <input type="text" id="msgInput" name="message" placeholder="Oyun içi mesaj veya komut yaz (Örn: /login salakmustafa veya Sa)" required autocomplete="off">
                        <button type="submit">Gönder</button>
                    </form>
                </div>
            </div>
            <script>
                // Yazı yazarken sayfanın otomatik yenilenip yazıyı silmesini engeller
                let isTyping = false;
                const inputElem = document.getElementById('msgInput');
                inputElem.addEventListener('focus', () => isTyping = true);
                inputElem.addEventListener('blur', () => isTyping = false);

                setInterval(() => {
                    if (!isTyping) location.reload();
                }, 4000);
            </script>
        </body>
        </html>
    `);
});

// WEBDEN GÖNDERİLEN MESAJI OYUNA İLETME
app.post('/send', (req, res) => {
    const msg = req.body.message;
    if (bot && msg) {
        bot.chat(msg);
        addLog(`[SİZ (WEB)] ${msg}`);
    }
    res.redirect('/');
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

function createBot() {
    botStatus = 'Sunucuya Bağlanıyor...';
    isLoggedIn = false;
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
        
        // Çift login komutu atıp lobiden engel yememesi için kontrol
        if (!isLoggedIn) {
            isLoggedIn = true;
            setTimeout(() => {
                bot.chat(`/login ${BOT_CONFIG.password}`);
                addLog('Otomatik /login komutu gönderildi.');
            }, 3000);
        }
    });

    bot.on('messagestr', (message) => {
        if (message.trim().length > 0) {
            console.log('[CHAT]:', message);
            addLog(`[CHAT] ${message}`);
        }
    });

    bot.on('kicked', (reason) => {
        botStatus = 'Sunucudan Atıldı';
        isLoggedIn = false;
        addLog(`[UYARI] Sunucudan atıldı! Sebep: ${reason}`);
    });

    bot.on('error', (err) => {
        botStatus = 'Hata Oluştu';
        isLoggedIn = false;
        addLog(`[HATA] ${err.message}`);
    });

    bot.on('end', (reason) => {
        botStatus = 'Bağlantı Koptu';
        isLoggedIn = false;
        addLog(`Bağlantı koptu (${reason}). 20s sonra tekrar deneniyor...`);
        setTimeout(createBot, 20000);
    });
}

createBot();
// Sunucudan atılma durumunda
    bot.on('kicked', (reason) => {
        botStatus = 'Sunucudan Atıldı';
        isLoggedIn = false;
        addLog(`[UYARI] Sunucudan atıldı! Sebep: ${typeof reason === 'object' ? JSON.stringify(reason) : reason}`);
    });

    // Bağlantı koptuğunda (35 saniye bekleme süresi eklendi)
    bot.on('end', (reason) => {
        botStatus = 'Bağlantı Koptu';
        isLoggedIn = false;
        addLog(`Bağlantı koptu (${reason}). Sunucudaki oturumun düşmesi için 35 sn bekleniyor...`);
        
        // Eski bot nesnesini tamamen temizle
        if (bot) {
            bot.removeAllListeners();
            bot = null;
        }

        // 35 saniye sonra temiz sıfırdan bağlan
        setTimeout(createBot, 35000);
    });
