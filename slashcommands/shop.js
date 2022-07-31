const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    Client,
    MessageEmbed,
    MessageSelectMenu,
    MessageActionRow,
} = require('discord.js')
const token = `<:token:1003272629286883450>`
const db = require('../database/models/token')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse the shop.'),
    /**
     *
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const userId = interaction.user.id
        const bal1 = await db.findOne({ userId })

        const Shop = new MessageEmbed()
            .setTitle('Token Shop [BETA]')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`**Tokens:** ${bal1?.tokens || 0} ${token}`)
            .addField(
                '<:text_channel:1003342275037888522> Private Channel [Temporary]',
                `\` 💲 \` **Price** - 25,000 ${token}\n\` ⏰ \` **Time** - 7 Days\n\` 🔄 \` **Upkeep** - 500 ${token} / Day`
            )
            .addField(
                `<:role:1003345268751741099> Custom Role [Temporary]`,
                `\` 💲 \` **Price** - 50,000 ${token}\n\` ⏰ \` **Time** - 7 Days\n\` 🔄 \` **Upkeep** - 5000 ${token} / Week`
            )
            .addField(
                `🫂 Fellowship Invites [Permanent]`,
                `\` 💲 \` **Price** - 70,000 ${token}\n\` ⏰ \` **Time** - ♾`
            )
            .setFooter({
                text: 'Your perks may be revoked by an admin if the system is abused in any way.',
            })

        const selectMenu = new MessageSelectMenu()
            .setMaxValues(1)
            .setMinValues(1)
            .setPlaceholder('Purchase an item')
            .setCustomId('shop-menu')
            .addOptions([
                {
                    label: 'Buy a Private Channel',
                    value:
                        bal1?.tokens > 25000
                            ? 'Select this to buy a Private Channel!'
                            : 'You cannot afford this purchase!',
                    emoji: '1003342275037888522',
                },
                {
                    label: 'Buy a Custom Role',
                    value:
                        bal1?.tokens > 50000
                            ? 'Select this to buy a Custom Role!'
                            : 'You cannot afford this purchase!',
                    emoji: '1003345268751741099',
                },
                {
                    label: 'Buy a Fellowship Invite',
                    value:
                        bal1?.tokens > 70000
                            ? 'Select this to buy a Fellowship Invite!'
                            : 'You cannot afford this purchase!',
                    emoji: '🫂',
                },
            ])
        await interaction.reply({
            embeds: [Shop],
            components: [new MessageActionRow().addComponents([selectMenu])],
        })

        const message = await interaction.fetchReply()
        const collector = message.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== interaction.user.id) {
                    return b.reply({
                        content: 'This is not your menu',
                        ephemeral: true,
                    })
                } else {
                    b.reply({
                        content: 'test',
                    })
                }
            },
        })
    },
}
