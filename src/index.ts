import { Client, Events } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord bot is ready! Logged in as ${readyClient.user.tag}`);

    const connectedGuilds = readyClient.guilds.cache.map(guild => guild.id);

    for (const guildId of connectedGuilds) {
        try {
            await deployCommands({ guildId: guildId });
            console.log(`✅ Successfully deployed commands to server: ${guildId}`);
        } catch (error) {
            console.error(`❌ Failed to deploy to server: ${guildId}`, error);
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
        commands[commandName as keyof typeof commands].execute(interaction);
    }
});

client.login(config.DISCORD_TOKEN);