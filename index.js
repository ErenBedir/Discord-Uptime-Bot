const { PermissionsBitField, EmbedBuilder, ButtonStyle, Client, GatewayIntentBits, ChannelType, Partials, ActionRowBuilder, SelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, SelectMenuInteraction, ButtonBuilder } = require("discord.js");
const INTENTS = Object.values(GatewayIntentBits);
const PARTIALS = Object.values(Partials);
const Discord = require("discord.js")
const Bedirdb = require("croxydb")
const client = new Client({
    intents: INTENTS,
    allowedMentions: {
        parse: ["users"]
    },
    partials: PARTIALS,
    retryLimit: 3
});

global.client = client;
client.commands = (global.commands = []);

const { readdirSync } = require("fs")
const { TOKEN } = require("./config.json");
readdirSync('./commands').forEach(f => {
    if (!f.endsWith(".js")) return;

    const props = require(`./commands/${f}`);

    client.commands.push({
        name: props.name.toLowerCase(),
        description: props.description,
        options: props.options,
        dm_permission: false,
        type: 1
    });

    console.log(`[COMMAND] ${props.name} komutu yüklendi.`)

});
readdirSync('./events').forEach(e => {

    const eve = require(`./events/${e}`);
    const name = e.split(".")[0];

    client.on(name, (...args) => {
        eve(client, ...args)
    });
    console.log(`[EVENT] ${name} eventi yüklendi.`)
});


client.login(TOKEN)

// Uptime Modal
const BedirModal = new ModalBuilder()
    .setCustomId('form')
    .setTitle('Link Ekle')
const u2 = new TextInputBuilder()
    .setCustomId('link')
    .setLabel('Proje Linkinizi Giriniz')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(8)
    .setMaxLength(200)
    .setPlaceholder('https://erenbedir.glitch.me')
    .setRequired(true)

const row1 = new ActionRowBuilder().addComponents(u2);
BedirModal.addComponents(row1);


const BedirModal2 = new ModalBuilder()
    .setCustomId('form2')
    .setTitle('Link Sil')
const u3 = new TextInputBuilder()
    .setCustomId('baslik1')
    .setLabel('Proje Linkini Giriniz')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(8)
    .setMaxLength(200)
    .setPlaceholder('https://erenbedir.glitch.me')
    .setRequired(true)

const row2 = new ActionRowBuilder().addComponents(u3);
BedirModal2.addComponents(row2);

// Uptime Kanala Gönderme
client.on('interactionCreate', async interaction => {

    if (interaction.commandName === "uptime-ayarla") {

        const row = new Discord.ActionRowBuilder()

            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Ekle")
                    .setStyle(Discord.ButtonStyle.Success)
                    .setCustomId("ekle")
            )
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Sil")
                    .setStyle(Discord.ButtonStyle.Danger)
                    .setCustomId("sil")
            )
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Linklerim")
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setCustomId("linklerim")
            )

        const server = interaction.guild
        let sistem = Bedirdb.get(`uptimeSistemi_${interaction.guild.id}`)
        if (!sistem) return;
        let channel = sistem.kanal

        const uptimeMesaj = new Discord.EmbedBuilder()
            .setColor("#F70808")
            .setTitle("Uptime Servisi")
            .setDescription("`・` Projelerinizi uptime etmek için **Ekle** butonuna tıklayın\n`・` Uptime edilen linklerinizi silmek için **Sil** butonuna tıklayın\n`・` Eklenen linklerini görmek için **Linklerim** butonuna tıklayın")
            .setThumbnail(server.iconURL({ dynamic: true }))
            .setFooter({ text: "Bedir Uptime 2023 | erenarius" })

        interaction.guild.channels.cache.get(channel).send({ embeds: [uptimeMesaj], components: [row] })

    }

})

// Uptime Ekle
client.on('interactionCreate', async interaction => {
    if (interaction.customId === "ekle") {

        await interaction.showModal(BedirModal);
    }
})

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ModalSubmit) return;
    if (interaction.customId === 'form') {

        if (!Bedirdb.fetch(`uptimeLinks_${interaction.user.id}`)) {
            Bedirdb.set(`uptimeLinks_${interaction.user.id}`, [])
        }

        const link = interaction.fields.getTextInputValue("link")

        let link2 = Bedirdb.fetch(`uptimeLinks_${interaction.user.id}`, [])

        let sistem = Bedirdb.get(`uptimeSistemi_${interaction.guild.id}`)
        if (!sistem) return;
        let ozelrol = sistem.rol
        let log = sistem.log
        if (!log) return;
        var logChannel = client.channels.cache.get(log)

        if (!link) return;

        if (!interaction.member.roles.cache.has(ozelrol)) {
            if (Bedirdb.fetch(`uptimeLinks_${interaction.user.id}`).length >= 0) {
                return interaction.reply({
                    content: "Bu Botu Yalnızca Premium Kullanıcılar Kullanabilir!",
                    ephemeral: true
                }).catch(e => { })
            }
        }
        // LİMİT AYARLARI 
        if (interaction.member.roles.cache.has(ozelrol)) {
            if (Bedirdb.fetch(`uptimeLinks_${interaction.user.id}`).length >= 6) {
                return interaction.reply({
                    content: "En fazla 6 link ekleyebilirsin!",
                    ephemeral: true
                }).catch(e => { })
            }
        }

        if (link2.includes(link)) {
            return interaction.reply({
                content: "Bu link zaten sistemde mevcut!",
                ephemeral: true
            }).catch(e => { })
        }

        if (!link.startsWith("https://")) {
            return interaction.reply({
                content: "Uptime linkin hatalı, lütfen başında `https://` olduğundan emin ol!",
                ephemeral: true
            }).catch(e => { })
        }

        if (!link.endsWith(".glitch.me")) {
            return interaction.reply({
                content: "Uptime linkin hatalı, lütfen sonunda `.glitch.me` olduğundan emin ol!",
                ephemeral: true
            }).catch(e => { })
        }

        if (link.includes("uptime")) {

            const logEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`<@${interaction.user.id}> adlı kullanıcı sisteme **uptime botu** eklemeye çalıştı!`)

            logChannel.send({ embeds: [logEmbed] }).catch(e => { })

            return interaction.reply({
                content: "Sistemimize uptime botu ekleyemezsin!",
                ephemeral: true
            }).catch(e => { })
        }


        Bedirdb.push(`uptimeLinks_${interaction.user.id}`, link)
        Bedirdb.push(`uptimeLinks`, link)
        interaction.reply({
            content: "Linkin başarıyla uptime sistemine eklendi!",
            ephemeral: true
        }).catch(e => { })

        const logEmbed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`<@${interaction.user.id}> adlı kullanıcı sisteme bir link ekledi!\n\n:link: Link: \`${link}\``)

        logChannel.send({ embeds: [logEmbed] }).catch(e => { })
    }
})


// Uptime Sil
client.on('interactionCreate', async interaction => {
    if (interaction.customId === "sil") {

        await interaction.showModal(BedirModal2);
    }
})

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ModalSubmit) return;
    if (interaction.customId === 'form2') {

        let sistem = Bedirdb.get(`uptimeSistemi_${interaction.guild.id}`)
        if (!sistem) return;
        let log = sistem.log
        if (!log) return;
        var logChannel = client.channels.cache.get(log)

        const links = Bedirdb.get(`uptimeLinks_${interaction.user.id}`)
        let linkInput = interaction.fields.getTextInputValue("baslik1")

        if (!links.includes(linkInput)) return interaction.reply({ content: "Sistemde böyle bir link mevcut değil!", ephemeral: true }).catch(e => { })

        Bedirdb.unpush(`uptimeLinks_${interaction.user.id}`, linkInput)
        Bedirdb.unpush(`uptimeLinks`, linkInput)

        interaction.reply({ content: "Linkin başarıyla sistemden silindi!", ephemeral: true }).catch(e => { })

        const logEmbed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`<@${interaction.user.id}> adlı kullanıcı sistemden bir **link sildi!**\n\n:link: Link: \`${linkInput}\``)

        logChannel.send({ embeds: [logEmbed] }).catch(e => { })
    }
})
// Eren Bedir

// Linklerim
client.on('interactionCreate', async interaction => {
    if (interaction.customId === "linklerim") {

        const rr = Bedirdb.get(`uptimeLinks_${interaction.user.id}`)
        if (!rr) return interaction.reply({ content: "Sisteme eklenmiş bir linkin yok!", ephemeral: true })

        const links = Bedirdb.get(`uptimeLinks_${interaction.user.id}`).map(map => `▶️ \`${map}\` `).join("\n")

        const linklerimEmbed = new EmbedBuilder()
            .setTitle(`Uptime Linklerin`)
            .setDescription(`${links || "Sisteme eklenmiş bir link yok!"}`)
            .setFooter({ text: "Bedir Code" })
            .setColor("Blurple")

        interaction.reply({
            embeds: [linklerimEmbed],
            ephemeral: true
        }).catch(e => { })

    }
})