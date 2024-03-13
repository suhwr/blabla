const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadMediaMessage,
    groupParticipantsUpdate
} = require("@whiskeysockets/baileys");
const Pino = require("pino");
const fs = require("fs");
const useCODE = process.argv.includes("--useCODE");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require('child_process');

let bannedNumbers = []; // Inisialisasi array untuk menyimpan nomor yang diblokir

try {
    // Membaca file banned.json jika ada
    const bannedData = fs.readFileSync("./banned.json", "utf8");
    bannedNumbers = JSON.parse(bannedData);
} catch (err) {
    // Tangani jika file banned.json tidak ditemukan
    console.error("Gagal membaca file banned:", err);
}

let ownerIds;
try {
    const config = JSON.parse(fs.readFileSync("./config.json"));
    ownerIds = config.ownerIds;
} catch (err) {
    console.error("Gagal membaca file konfigurasi:", err);
    ownerIds = [];
}
console.log("Owner ID:", ownerIds);


let creds;
try {
    creds = JSON.parse(fs.readFileSync("./auth/creds.json"));
} catch (err) {
    creds = null;
}

async function connectToWhatsapp() {
    const auth = await useMultiFileAuthState("auth");
    ////
    let browser;
    if (!creds) {
        browser = useCODE
            ? ["Chrome (Linux)", "", ""]
            : ["Sibay", "Firefox", "1.0.0"];
    } else {
        if (!creds.pairingCode || creds.pairingCode === "") {
            browser = ["Sibay", "Firefox", "1.0.0"];
        } else {
            browser = ["Chrome (Linux)", "", ""];
        }
    }
    console.log(browser);

    const socket = makeWASocket({
        printQRInTerminal: !useCODE,
        browser: browser,
        auth: auth.state,
        logger: Pino({ level: "silent" }),
        generateHighQualityLinkPreview: true
    });
    ////
    if (useCODE && !socket.user && !socket.authState.creds.registered) {
        const question = pertanyaan =>
            new Promise(resolve => {
                const readline = require("readline").createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                readline.question(pertanyaan, answer => {
                    resolve(answer);
                    readline.close();
                });
            });
        const nomorWa = await question("Masukkan nomor whatsapp anda: +");
        setTimeout(async function () {
            const pairingCode = await socket.requestPairingCode(nomorWa);
            console.log("Pairing code anda: ", pairingCode);
        }, 3000);
    }
    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", ({ connection }) => {
        if (connection === "open")
            console.log(
                "Nomor WA Yang Terhubung: " + socket.user.id.split(":")[0]
            );
        if (connection === "close") connectToWhatsapp();
    });
    socket.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        function reply(text) {
            socket.sendMessage(
                msg.key.remoteJid,
                { text: text },
                { quoted: msg }
            );
        }
        /* Menambahkan switch case command */
        //console.log(msg);
        if (!msg.message) return;
        const msgType = Object.keys(msg.message)[0];
        const msgText =
            msgType === "conversation"
                ? msg.message.conversation
                : msgType === "extendedTextMessage"
                ? msg.message.extendedTextMessage.text
                : msgType === "imageMessage"
                ? msg.message.imageMessage.caption
                : "";
             const botNum = socket.user.id.split(":")[0] + '@s.whatsapp.net'
             const groupId = msg.key.remoteJid;
             const senderId = msg.key.participant;
              const isGroup = msg.key.remoteJid.endsWith('@g.us');
                  //console.log("apakah ini grup:", isGroup);
                  const groupInfo = isGroup ? await socket.groupMetadata(groupId): ''
                  const senderIsAdmin = isGroup ? groupInfo.participants.some(participant => participant.id === senderId && participant.admin === 'admin'):''
                  const senderIsSuperAdmin = isGroup ? groupInfo.participants.some(participant => participant.id === senderId && participant.admin === 'superadmin'):''
                 /*console.log("Apakah pengirim pesan adalah admin:", senderIsAdmin);
                  console.log("Apakah pengirim pesan adalah superadmin:", senderIsSuperAdmin);*/
                  const isBotAdmin = isGroup ? groupInfo.participants.filter(participant => participant.id === botNum && (participant.admin === 'admin' || participant.admin === 'superadmin')):''
               // console.log("Apakah bot adalah admin:", botAdmins);
                  const botAdmins = isBotAdmin.length > 0;
             //   console.log("Apakah bot adalah admin:", isBotAdmin);
             const isOwner = ownerIds.includes(senderId);
            //console.log("Apakah pengirim pesan adalah pemilik:", isOwner);
            
            function saveBannedNumbers() {
    fs.writeFileSync("./banned.json", JSON.stringify(bannedNumbers, null, 4));
            }
    const isBlocked = bannedNumbers.includes(senderId);
    const isNotBlocked = !isBlocked;
const words = msgText.split(" ");
// Command untuk memblokir pengguna
if (words.length === 2 && (words[0] === ".ban" || words[0] === ",ban" || words[0] === "!ban")) {
    try {
        if (!isOwner) {
            reply("kamu tidak berhak");
            return;
        }
        const targetId = words[1];
        if (!targetId.startsWith("@") && !targetId.startsWith("")) {
            reply("Format mention atau nomor tidak valid. Mohon pastikan menggunakan format yang benar.");
            return;
        }
        const formattedTargetId = targetId.startsWith("@") ? targetId.slice(1) : targetId;
        bannedNumbers.push(formattedTargetId + "@s.whatsapp.net");
        fs.writeFileSync("./banned.json", JSON.stringify(bannedNumbers, null, 2));
        reply(`Pengguna dengan ID ${formattedTargetId} berhasil diblokir.`);
        return;
    } catch (error) {
        console.error(error);
        reply("Gagal memblokir pengguna. Silakan coba lagi.");
    }
}

// Command untuk membuka blokir pengguna
if (words.length === 2 && (words[0] === ".unban" || words[0] === ",unban" || words[0] === "!unban")) {
    try {
        if (!isOwner) {
            reply("kamu tidak berhak");
            return;
        }
        const targetId = words[1];
        if (!targetId.startsWith("@") && !targetId.startsWith("")) {
            reply("Format mention atau nomor tidak valid. Mohon pastikan menggunakan format yang benar.");
            return;
        }
        const formattedTargetId = targetId.startsWith("@") ? targetId.slice(1) : targetId;
        const index = bannedNumbers.indexOf(formattedTargetId + "@s.whatsapp.net");
        if (index !== -1) {
            bannedNumbers.splice(index, 1);
            fs.writeFileSync("./banned.json", JSON.stringify(bannedNumbers, null, 2));
            reply(`Pengguna dengan ID ${formattedTargetId} berhasil dibuka blokir.`);
        } else {
            reply(`Pengguna dengan ID ${formattedTargetId} tidak ditemukan dalam daftar yang diblokir.`);
        }
        return;
    } catch (error) {
        console.error(error);
        reply("Gagal membuka blokir pengguna. Silakan coba lagi.");
    }
}


           
        if (words.length === 1 && words[0] === ".add" || words[0] === ",add" || words[0] === "!add") {
    reply("Mohon berikan nomor.");
    return;
}
        if (words.length === 2 && words[0] === ".add") {
            try{
             if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
            if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
            if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
            const targetNumber = words[1];
            if (!targetNumber.startsWith("")) {
                reply("Format nomor tidak valid. Mohon pastikan nomor diawali dengan kode negara (misalnya `62`,`60`).");
                return;
            }
            const response = await socket.groupParticipantsUpdate(groupId, [`${targetNumber}@s.whatsapp.net`], "add");
            reply(`Anggota dengan nomor ${targetNumber} berhasil ditambahkan ke grup.`);
            return;
        } catch (error) {
          console.error(error)
          reply("GAGAL!, mohon periksa apakah nomor sudah benar, atau mungkin member tersebut baru baru ini keluar, ataupun menonaktifkan tambah grup");
            }
        }
    

if (words.length === 2 && words[0] === ".kick" || words[0] === ",kick" || words[0] === "!kick") {
try {
  if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
  if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
 if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
  if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
    const targetId = words[1];
if (!targetId.startsWith("@") && !targetId.startsWith("")) {
        reply("Format mention atau nomor tidak valid. Mohon pastikan menggunakan format yang benar.");
        return;
    }
    const formattedTargetId = targetId.startsWith("@") ? targetId.slice(1) : targetId;
    const response = await socket.groupParticipantsUpdate(
        groupId,
        [`${formattedTargetId}@s.whatsapp.net`], // Menggunakan format nomor yang sesuai
        "remove"
    );

    reply(`Anggota dengan ID ${formattedTargetId} berhasik di kick.`);
    return;
}catch (error) {
          console.error(error)
          reply("kegagalan tak terduga, tolong ulangi, jika masih gagal hubungi owner");
            }
        }
    if (words.length === 1 && words[0] === ".promote") {
    reply("Mohon berikan nomor atau mention anggota yang ingin dijadikan admin.");
    return;
}
if (words.length === 2 && words[0] === ".promote" || words[0] === ",promote" || words[0] === "!promote") {
try {
     if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
  if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
  if (!senderIsAdmin && !senderIsSuperAdmin && isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
    const targetId = words[1];
if (!targetId.startsWith("@") && !targetId.startsWith("")) {
        reply("Format mention atau nomor tidak valid. Mohon pastikan menggunakan format yang benar.");
        return;
    }
    const formattedTargetId = targetId.startsWith("@") ? targetId.slice(1) : targetId;
    const response = await socket.groupParticipantsUpdate(
        groupId,
        [`${formattedTargetId}@s.whatsapp.net`], // Menggunakan format nomor yang sesuai
        "promote"
    );

    reply(`Anggota dengan ID ${formattedTargetId} menjadi admin.`);
    return;
}catch (error) {
          console.error(error)
          reply("kegagalan tak terduga, tolong ulangi, jika masih gagal hubungi owner");
            }
        }
    if (words.length === 1 && words[0] === ".demote") {
    reply("Mohon berikan nomor atau mention admin yang ingin diturunkan .");
    return;
}
if (words.length === 2 && words[0] === ".demote" || words[0] === "!demote" || words[0] === ",demote") {
try {
     if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
  if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
  if (!senderIsAdmin && !senderIsSuperAdmin && isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
    const targetId = words[1];
if (!targetId.startsWith("@") && !targetId.startsWith("")) {
        reply("Format mention atau nomor tidak valid. Mohon pastikan menggunakan format yang benar.");
        return;
    }
    const formattedTargetId = targetId.startsWith("@") ? targetId.slice(1) : targetId;
    const response = await socket.groupParticipantsUpdate(
        groupId,
        [`${formattedTargetId}@s.whatsapp.net`],
        "demote"
    );

    reply(`Admin dengan ID ${formattedTargetId} sekarang adalah member biasa.`);
    return;
}catch (error) {
          console.error(error)
          reply("kegagalan tak terduga, tolong ulangi, jika masih gagal hubungi owner");
            }
        }
        if (!msgText.startsWith(".") && !msgText.startsWith(",") && !msgText.startsWith("!")) return;
        const command = msgText.replace(/^[.,!]/g, "");
        console.log(`Message Type: ${msgType}\nMessage Text: ${msgText}`);
        console.log(`Command: ${command}`);
        const id = msg.key.remoteJid;

        switch (command.toLowerCase()) {
            case "sticker":
            case "s":
            case ".":
                try {
                     if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
                  if (!msg.message.imageMessage) {
            reply("Silakan kirim gambar dengan caption, dan jangan reply (belum bisa soalnya :v)");
            return;
                
                }
               
        const buffer = await downloadMediaMessage(msg, "buffer", {}, {logger: Pino });
        const stickerFileName = `sticker_${Date.now()}.png`;
        fs.writeFileSync(`./${stickerFileName}`, buffer);
        const createSticker = () => {
        return new Promise((resolve, rejects) => {
          ffmpeg(`./${stickerFileName}`)
            .format("webp")
            .outputOptions("-vcodec","libwebp","-vf","scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split[a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse")      
            .on("error", err => rejects(err))
            .on("end", () => resolve(stickerFileName.replace(".png", ".webp")))
           .save(`./${stickerFileName.replace(".png", ".webp")}`);
          });
        }; 
        const sticker = await createSticker();
        await socket.sendMessage(
          id, 
          {sticker: { url: sticker }}, 
          {quoted: msg}
          );
        ["./" + stickerFileName, "./" + stickerFileName.replace(".png", ".webp")].forEach(fileName => {
          if (fs.existsSync(fileName)) {
            fs.rmSync(fileName);
          } else {
            console.log(`File ${fileName} tidak ditemukan.`);
          }
        });
         } catch (error) {
                console.error("Error creating sticker:", error);
                reply("kegagalan tak terduga, tolong ulangi, jika masih gagal hubungi owner");
            } 
            break;
            case "image":
                socket.sendMessage(
                    id,
                    { image: { url: "./image.png" }, mimeType: "image/png" },
                    { quoted: msg }
                );
                break;
                case "getgroupmetadata":
                  try {
    const groupInfo = await socket.groupMetadata(msg.key.remoteJid);
    console.log("Metadata Grup:", groupInfo)
} catch (error) {
    console.error("Error:", error);
}
                  break;
            case "p":
              try{
              console.log(msg);
              const contextInfo = msg.message.extendedTextMessage.contextInfo;
              console.log(contextInfo);
              console.log(message);
              const metadata = msg.message.viewOnceMessageV2;
        console.log("Metadata Pesan:", metadata);
             } catch (error){}
              break;
           case "admin":
           case "min":
    try {
        const groupId = msg.key.remoteJid;
        const groupInfo = await socket.groupMetadata(groupId);
        const admins = groupInfo.participants.filter(member => member.admin === 'admin');
        if (admins.length === 0) {
            reply("Tidak ada admin dalam grup ini.");
            return;
        }
        const adminLinks = admins.map(admin => `${admin.id.split('@')[0]}`);
        const adminListString = adminLinks.join('\n');
        reply(`Daftar admin dalam grup:\n ${adminListString}`);

    } catch (error) {
        console.error("Error getting admin list:", error);
        reply("Gagal mendapatkan daftar admin grup!");
    }
    break;
    case "open":
    case "opn":
    case "o":
    try {
         if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
      if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
        if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
        reply("kamu bukan atmin!!");
        return;
        }
        // Jika pengirim pesan adalah admin, lakukan pembukaan grup
        await socket.groupSettingUpdate(groupId, "not_announcement");
        reply("Grup berhasil dibuka!");
    } catch (error) {
        console.error("Error opening group:", error);
        reply("Gagal membuka grup!");
    }
    break;

case "close":
case "cls":
case "c":
    try {
         if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
      if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
      if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
        reply("kamu bukan atmin!!");
        return;
        }
        await socket.groupSettingUpdate(groupId, "announcement");
        reply("Grup berhasil ditutup!");
    } catch (error) {
        console.error("Error closing group:", error);
        reply("Gagal menutup grup!");
    }
    break;
    case "enhance":
    case "enh":
            try {
                 if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
              if (!msg.message.imageMessage) {
            reply("Silakan kirim gambar dengan caption, dan jangan reply (belum bisa soalnya :v)");
            return;
                }
        reply("Sedang memproses gambar...");
        const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: Pino });
                const inputImagePath = `./input_image_${Date.now()}.png`;
                fs.writeFileSync(inputImagePath, buffer);

                const timestamp = new Date().getTime();
                const outputImagePath = `./enhanced_image_${timestamp}.png`;

                // Command to enhance image using ImageMagick
                const enhanceCommand = `magick convert ${inputImagePath} -modulate 100,95,100 -auto-level -normalize -contrast-stretch 0.1%x4% -sharpen 0.5 -unsharp 1.3x0.5+0.7+0.04 -enhance -resize 285% -filter Lanczos -blur 0.8x0.8 -quality 100 ${outputImagePath}`;

                exec(enhanceCommand, async (error, stdout, stderr) => {
                    if (error) {
                     console.error(`Error enhancing image: ${error.message}`);
                        reply("Kegagalan dalam meningkatkan kualitas gambar.");
                        return;
                    }
                    if (stderr) {
                        console.error(`Error enhancing image: ${stderr}`);
                        reply("Kegagalan dalam meningkatkan kualitas gambar.");
                        return;
                    }

                    // Kirim gambar yang telah ditingkatkan
                    await socket.sendMessage(id, { image: { url: outputImagePath } }, { quoted: msg });

                    // Hapus gambar yang telah dikirimkan
                   fs.unlinkSync(inputImagePath);
                   fs.unlinkSync(outputImagePath);
                });
            } catch (error) {
                console.error("Error enhancing image:", error);
                reply("Kegagalan tak terduga dalam meningkatkan kualitas gambar.");
            }
            break;
            case "gruplink":
case "linkgrup":
case "linkgc":
case "gclink":
    try {
         if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
      if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
        if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
        const code = await socket.groupInviteCode(groupId);
        reply(`https://chat.whatsapp.com/${code}`);
    } catch (error) {
        console.error("Error getting group link:", error);
        reply("Gagal mendapatkan tautan grup!");
    }
    break;
    case "newlinkgc":
    case "newgclink":
    case "nwlnkgc":
    case "nwlink":
      try{
           if (!isNotBlocked) {
    reply("kamu telah diblokir :v");
    return;
}
        if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
        if (!senderIsAdmin && !senderIsSuperAdmin && !isOwner) {
            reply("kamu bukan atmin!");
            return;
        }
      const newLinkGrup = await socket.groupRevokeInvite(groupId);
      reply(`https://chat.whatsapp.com/${newLinkGrup}`);
    } catch (error) {
        console.error("Error getting group link:", error);
        reply("Gagal mendapatkan tautan grup!");
    }
    break;
    
            case "tesadmin":
              if (!isGroup) {
              reply("hanya bisa digunakan di grup");
              return;
            }
            if (!botAdmins) {
              reply("bot bukan admin");
              return;
            }
        if (!senderIsAdmin && !senderIsSuperAdmin) {
            reply("kamu bukan atmin!");
            return;
        }
        // Jika pengirim adalah admin, lanjutkan eksekusi perintah
        reply("kamu atmin");
        break;
        case "menu":
        case "help":
             const menutxt = `
                  
Command Umum: 
   .stiker: Membuat stiker dari gambar,
   .enhance: Meningkatkan kualitas gambar
   
Command Grup: 
   .add [nomor]: Menambahkan anggota ke grup,
   .kick [nomor]: Mengeluarkan anggota dari grup,
   .promote: Menaikkan status anggota menjadi admin,
   .demote: Menurunkan status admin menjadi anggota biasa,
   .gruplink: Mengirim tautan undangan grup,
   .newgruplink: Membuat tautan undangan baru untuk grup
   
Command Owner: 
   ban: Memban pengguna dari menggunakan bot,
   unban: Membuka blokir pengguna yang dibanned
            `;
reply(menutxt);
break;
        }
    });
}

connectToWhatsapp();

