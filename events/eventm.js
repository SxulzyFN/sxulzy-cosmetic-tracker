// events/messageCreate.js - Listens for !code messages
const { Events, EmbedBuilder } = require('discord.js');
const { getAccessToken } = require('../services/epic');
const { saveTokens } = require('../utils/storage');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Check if message starts with !code
        if (!message.content.startsWith('!code ')) return;

        // Extract the authorization code
        const authCode = message.content.slice(6).trim();

        if (!authCode) {
            return message.reply({
                content: '❌ Please provide an authorization code. Usage: `!code YOUR_AUTH_CODE`',
            });
        }

        // Send a processing message
        const processingEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('⏳ Processing...')
            .setDescription('Exchanging your authorization code for tokens...');

        const reply = await message.reply({ embeds: [processingEmbed] });

        try {
            // Exchange the auth code for tokens
            const tokens = await getAccessToken(authCode);

            // Save tokens for this Discord user
            saveTokens(message.author.id, tokens);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Account Linked Successfully!')
                .setDescription('Your Epic Games account has been linked.')
                .addFields(
                    {
                        name: '🎮 Account ID',
                        value: `\`${tokens.accountId}\``,
                        inline: false
                    },
                    {
                        name: '📦 Next Step',
                        value: 'Use `/locker` to download your Fortnite locker!',
                        inline: false
                    }
                )
                .setTimestamp();

            await reply.edit({ embeds: [successEmbed] });

            // Try to delete the user's message containing the code for security
            try {
                await message.delete();
            } catch (deleteError) {
                // Bot might not have permission to delete messages
                console.warn('⚠️ Could not delete message with auth code');
            }

        } catch (error) {
            console.error('❌ Error processing auth code:', error);

            // Error embed
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Authentication Failed')
                .setDescription('Failed to exchange your authorization code.')
                .addFields(
                    {
                        name: 'Error',
                        value: `\`\`\`${error.message}\`\`\``,
                        inline: false
                    },
                    {
                        name: '💡 Possible Causes',
                        value: '• The code has expired (they expire quickly!)\n• The code was already used\n• Invalid code format\n• Incorrect client credentials',
                        inline: false
                    },
                    {
                        name: '🔄 Try Again',
                        value: 'Use `/login` to get a new authorization link.',
                        inline: false
                    }
                );

            await reply.edit({ embeds: [errorEmbed] });
        }
    }
};
