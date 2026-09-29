import { CommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { sendNextFunFact } from "../fun-facts";

export const data = new SlashCommandBuilder()
    .setName("forcefact")
    .setDescription("Wymusza publikację kolejnej ciekawostki z kolejki panelu administratora.");

export async function execute(interaction: CommandInteraction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferError) {
        console.error("❌ Failed to defer reply in /forcefact:", deferError);
        return;
    }

    try {
        const hasPermission = interaction.user.id === "283120512497090583";

        if (!hasPermission) {
            await interaction.editReply({ content: "Nie masz uprawnień do korzystania z tej komendy." });
            return;
        }

        const result = await sendNextFunFact(interaction.client);
        if (result.success) {
            await interaction.editReply({ content: `✅ ${result.message}` });
        } else {
            await interaction.editReply({ content: `ℹ️ ${result.message}` });
        }
    } catch (error) {
        console.error("Error executing forcefact command:", error);
        try {
            await interaction.editReply({ content: "Wystąpił błąd podczas wymuszania publikacji ciekawostki." });
        } catch {
            // Ignore if interaction expired
        }
    }
}
