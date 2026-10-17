
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('✅ BOT KURIR TASIKMALAYA ONLINE!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const pushName = msg.pushName || "Bos"

        console.log(`Pesan dari ${pushName}: ${text}`)

        // MENU UTAMA KURIR
        if(text.toLowerCase() === 'menu' || text.toLowerCase() === 'p' || text.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: `*BOT KURIR TASIKMALAYA - sepi77-s7* 🚚

Halo ${pushName}!
Ketik format order:

*FORMAT ORDER KURIR:*
KURIR#Nama#Alamat Jemput#Alamat Antar#Barang#Ongkir

Contoh:
KURIR#Sepi#Jl. Cieunteung No 5#Jl. Dadaha#Dokumen#15rb

*PERINTAH LAIN:*
- CEK ONGKIR - cek tarif
- CEK KURIR - cek kurir ready
- ADMIN - hubungi admin
- MENU - tampilkan menu ini
` })
        }
        // FORMAT ORDER
        else if(text.toUpperCase().startsWith('KURIR#')) {
            const data = text.split('#')
            if(data.length >= 5) {
                await sock.sendMessage(from, { text: `✅ *ORDER DITERIMA!*\n\nNama: ${data[1]}\nJemput: ${data[2]}\nAntar: ${data[3]}\nBarang: ${data[4]}\nOngkir: ${data[5] || 'Nego'}\n\nKurir sedang menuju lokasi jemput. Mohon tunggu, admin akan menghubungi.\nTerima kasih pakai Kurir Tasik! 🙏` })
                // Forward ke owner jika mau
            } else {
                await sock.sendMessage(from, { text: `❌ Format salah bro. Yang bener:\nKURIR#Nama#Jemput#Antar#Barang#Ongkir` })
            }
        }
        else if(text.toLowerCase().includes('cek ongkir')) {
            await sock.sendMessage(from, { text: `*TARIF KURIR TASIKMALAYA* 💰\n\nDalam Kota: 10k - 15k\nCibeureum - Mangkubumi: 12k\nKawalu - Tamansari: 15k-20k\nLuar Kota: Nego\n\nKirim alamat lengkap untuk cek akurat.` })
        }
        else if(text.toLowerCase().includes('cek kurir')) {
            await sock.sendMessage(from, { text: `✅ Kurir READY hari ini!\n\nJam Operasional: 08.00 - 21.00\nArea: Se-Kota Tasikmalaya\n\nSilahkan ORDER dengan format KURIR#...` })
        }
        else if(text.toLowerCase() === 'admin') {
            await sock.sendMessage(from, { text: `Admin Kurir: wa.me/628xxxx (ganti nomor kamu disini)\nFast respon!` })
        }
    })
}

startBot()
