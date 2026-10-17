
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    if(!sock.authState.creds.registered) {
        const nomor = "6288801009091" // GANTI INI JADI NOMOR WA BOT KAMU!!!
        setTimeout(async () => {
            const code = await sock.requestPairingCode(nomor)
            console.log(`KODE PAIRING: ${code}`)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('BOT KURIR ONLINE!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const pushName = msg.pushName || "Bos"
        if(text.toLowerCase() === 'menu' || text.toLowerCase() === 'p') {
            await sock.sendMessage(from, { text: `*BOT KURIR TASIK* 🚚\nHalo ${pushName}!\n\nKetik:\nKURIR#Nama#Jemput#Antar#Barang\nContoh:\nKURIR#Sepi#Jl. Cieunteung#Jl. Dadaha#Dokumen` })
        }
        else if(text.toUpperCase().startsWith('KURIR#')) {
            const d = text.split('#')
            await sock.sendMessage(from, { text: `✅ ORDER DITERIMA\nNama: ${d[1]}\nJemput: ${d[2]}\nAntar: ${d[3]}\nBarang: ${d[4]}\nKurir OTW!` })
        }
    })
}
startBot()
