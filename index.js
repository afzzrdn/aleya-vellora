require('dotenv').config();
const { 
  AFK_CHANNEL_ID, 
  ALLOWED_COMMAND_CHANNEL, 
  LOGS_CHANNEL_ID,
  ADMIN_ROLE_ID,
  AUTO_ROLE_ID
} = require('./config/ids');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const kataKasar = require('./utils/kataKasar');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
});

client.once('ready', async () => {
    await client.application.fetch(); // wajib untuk metadata dari portal
    console.log("App name:", client.application.name);
    console.log("Description:", client.application.description);
    console.log(`✅ Bot siap sebagai ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
    const welcomeChannelId = LOGS_CHANNEL_ID;
    const autoRoleId = AUTO_ROLE_ID;

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    const role = member.guild.roles.cache.get(autoRoleId);

    if (!channel) return console.log('⚠️ Welcome channel tidak ditemukan.');
    if (!role) {
        console.log('⚠️ Role otomatis tidak ditemukan.');
        return;
    }

    try {
        await member.roles.add(role);
        await channel.send({
            content: `UwU~ siapa nih yang baru datang? 🌸\nHaii <@${member.id}>~ selamat datang di **${member.guild.name}**~ ✨\nAleya cantik udah nungguin kamu dari tadi loh~ 😳\nYuk baca dulu <#1281186721857404969> biar gak dimarahin! 💅 Lalu kenalan yaa, biar makin akrab~ 💖`,
        });
        } catch (err) {
            console.error('❌ Gagal mengirim pesan selamat datang:', err);
        }
});

client.on('guildMemberRemove', async member => {
    const goodbyeChannelId = LOGS_CHANNEL_ID; // Buat ID channel perpisahan di .env
    const channel = member.guild.channels.cache.get(goodbyeChannelId);

    if (!channel) return console.log('⚠️ Goodbye channel tidak ditemukan.');

    try {
        await channel.send({
        content: `Ehhh~ <@${member.id}> kok pergi sih...? 😢\nPadahal Aleya cantik masih pengen ngobrol loh~ 💔\nSemoga kamu bahagia di tempat baru ya... tapi jangan lupa sama kita di **${member.guild.name}** yaa~ 🌸\nKalo rindu... pintu selalu terbuka kok~ 💌`,
        });
    } catch (err) {
        console.error('❌ Gagal mengirim pesan perpisahan:', err);
    }
});


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const found = kataKasar.find(word => content.includes(word));

    if (found) {
        try {
        await message.delete();
        await message.channel.send({
            content: `🚫 **${message.author.username}**, kata tersebut tidak diperbolehkan di server ini. Harap jaga sopan santun.`
        });

        // DM (opsional)
        try {
            await message.author.send(`⚠️ Pesan kamu dihapus karena mengandung kata tidak pantas: **${found}**.`);
        } catch (err) {
            console.log('DM gagal dikirim ke pengguna.');
        }
        } catch (err) {
        console.error('Gagal menghapus pesan atau memperingatkan:', err);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user, guild, channelId } = interaction;
    const allowedChannelId = ALLOWED_COMMAND_CHANNEL;

    if (channelId !== allowedChannelId) {
        return interaction.reply({
            content: `🚫 Perintah hanya boleh dijalankan di <#${allowedChannelId}>.`,
            ephemeral: true
        });
    }

    const hasRole = roleId => interaction.member.roles.cache.has(roleId);

    // Ping
    if (commandName === 'ping') {
        await interaction.reply('✨ Hai, aku di sini! Ping aku kapan saja, aku selalu siap menemani! 💖');

    } 
    // Owner
    else if (commandName === 'owner') {
        await interaction.reply('🌸 Aku dibuat oleh seorang yang sangat baik hati, yaitu <@542229001188671507>. Kunjungi https://muhammadafzaal.com untuk mengetahui penciptaku! 💖');

    } 
    // Warn
    else if (commandName === 'warn') {
        if (!hasRole(ADMIN_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }
        const target = options.getUser('user');
        const reason = options.getString('reason') || 'Tidak ada alasan diberikan.';

        if (!target) {
            return await interaction.reply({ content: '⚠️ Tolong sebutkan user yang ingin diperingatkan.', ephemeral: true });
        }

        // Kirim DM ke target (jika bisa)
        try {
            await target.send(`⚠️ Kamu telah diberi peringatan di server **${guild.name}**.\nAlasan: ${reason}`);
        } catch (err) {
            // Gagal mengirim DM
            return await interaction.reply({ content: '⚠️ Gagal mengirim DM'})
        }

        await interaction.reply(`✅ <@${target.id}> telah diperingatkan.\n📝 Alasan: ${reason}`);

    } 
    // AFK
    else if (interaction.commandName === 'afk') {
        const afkChannelId = AFK_CHANNEL_ID; // Tambahkan ID ini di .env

        const member = interaction.member;

        if (!member.voice.channel) {
            return interaction.reply({ content: '🚫 Kamu tidak berada di voice channel mana pun.', ephemeral: true });
        }

        try {
            await member.voice.setChannel(afkChannelId);
            await interaction.reply({ content: `✅ Kamu telah dipindahkan ke AFK channel.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Gagal memindahkan ke AFK channel.', ephemeral: true });
        }
    }
    // Ban
    else if (commandName === 'ban') {
        if (!hasRole(ADMIN_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }
        const target = options.getUser('user');
        const reason = options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return await interaction.reply('❌ Pengguna tidak ditemukan di server ini.');
        }

        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            return await interaction.reply('❌ Kamu tidak memiliki izin untuk mem-banned pengguna.');
        }

        try {
            await member.ban({ reason: reason });

            // Kirim DM ke pengguna yang dibanned (opsional, jika memungkinkan)
            try {
                await target.send(`⚠️ Kamu telah dibanned dari server **${interaction.guild.name}**.\nAlasan: ${reason}`);
            } catch (err) {
                console.log('Gagal mengirim DM.');
            }

            await interaction.reply(`✅ <@${target.id}> telah dibanned.\nAlasan: ${reason}`);
        } catch (err) {
            console.error(err);
            await interaction.reply('⚠️ Gagal mem-banned pengguna.');
        }
    }
    // Unban
    else if (commandName === 'unban') {
        if (!hasRole(ADMIN_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'Tidak ada alasan diberikan.';

        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            return await interaction.reply('❌ Kamu tidak memiliki izin untuk membatalkan ban pengguna.');
        }

        try {
            // Unban pengguna berdasarkan user ID
            await interaction.guild.members.unban(userId, reason);

            await interaction.reply(`✅ Pengguna dengan ID \`${userId}\` telah dibatalkan ban-nya.\nAlasan: ${reason}`);
        } catch (err) {
            console.error(err);
            await interaction.reply('⚠️ Gagal membatalkan ban pengguna. Pastikan ID pengguna valid dan mereka memang dibanned.');
        }
    }
    // Help
    else if (commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
        .setColor(0x000FFF)
        .setTitle('📖 Daftar Perintah Bot')
        .setDescription('Berikut adalah perintah yang tersedia : ')
        .addFields(
            { name: '/ping', value: 'Cek apakah bot aktif'},
            { name: '/owner', value: 'Informasi pembuat bot'},
            { name: '/warn', value: 'Warn Member'},
            { name: '/ban', value: 'Ban Member'},
            { name: '/unban', value: 'Unban Member'},
            { name: '/help', value: 'Menampilkan daftar perintah'}
        )
        .setFooter({ text: 'Gunakan perintah dengan bijak yaa! ✨'})
        .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
});


client.login(process.env.TOKEN);
