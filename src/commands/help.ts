import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Wyświetla dostępne komendy.");

export async function execute(interaction: CommandInteraction) {

    const helpEmbed = new EmbedBuilder()
        .setColor("#72B01D")
        .setTitle("Dostępne komendy")
        .addFields(
            {
                name: "/upcoming",
                value: "Wyświetla informację o następnym wydarzeniu."
            },
            {
                name: "/help",
                value: "Wyświetla tę wiadomość."
            },
            {
                name: "/forcevote",
                value: "[ADMIN ONLY] Wymusza stworzenie ankiety dla nadchodzącego wydarzenia"
            }
        )

    return interaction.reply({ embeds: [helpEmbed] });
}