import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Wyświetla dostępne komendy.");

export async function execute(interaction: CommandInteraction) {
    return interaction.reply("WIP");
}