import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { loadData } from "../helpers";
import { sentEventMessages, sendEventPoll } from "../event-checker";

export const data = new SlashCommandBuilder()
    .setName("forcevote")
    .setDescription("Wymusza głosowanie na nadchodzące wydarzenia.");

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const userId = interaction.user.id;
        // TODO: Add permission check synced with kkol.pl api discord-kkol acc connection.
        const hasPermission = interaction.user.id === "283120512497090583";

        if (!hasPermission) {
            await interaction.editReply({ content: "Nie masz uprawnień do korzystania z tej komendy." });
            return;
        }

        const events = await loadData("https://kkol.pl/api/events?format=list&upcoming=true&limit=1");
        if (!events || events.length === 0) {
            await interaction.editReply({ content: "Obecnie nie ma żadnych nadchodzących wydarzeń." });
            return;
        }

        const event = events[0];
        const isAlreadySent = sentEventMessages.has(event.id);

        const messageId = await sendEventPoll(interaction.client, event);

        if (!isAlreadySent) {
            sentEventMessages.set(event.id, messageId);
        }

        await interaction.editReply({ content: `Pomyślnie wysłano ankietę dla wydarzenia: **${event.name}**.` });
    } catch (error) {
        console.error("Error executing forcevote command:", error);
        await interaction.editReply({ content: "Wystąpił błąd podczas wymuszania głosowania." });
    }
}