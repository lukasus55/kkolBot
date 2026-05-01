import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { loadData } from "../helpers";

export const data = new SlashCommandBuilder()
    .setName("upcoming")
    .setDescription("Wyświetla informacje o najbliższym nadchodzącym wydarzeniu.");

export async function execute(interaction: CommandInteraction) {
    // Defer the reply to give the API time to respond without timing out Discord
    await interaction.deferReply();

    try {
        const baseUrl = "https://www.kkol.pl/";
        const events = await loadData(`${baseUrl}api/events?format=list&upcoming=true&limit=1`);

        if (!events || events.length === 0) {
            return interaction.editReply("Obecnie nie ma żadnych nadchodzących wydarzeń.");
        }

        const event = events[0];

        const tournamentId = event.tournament_id;
        const tournamentData = await loadData(`${baseUrl}api/tournaments?id=${tournamentId}`);
        const tournament = tournamentData[tournamentId];
        const tournamentName = tournament.displayed_name;
        const tournamentUrl = tournament.page_url === null ? baseUrl : baseUrl + tournament.page_url;

        const formatOptions: Intl.DateTimeFormatOptions = { 
            timeZone: 'Europe/Warsaw',
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };

        const startDate = new Date(event.event_date).toLocaleString('pl-PL', formatOptions);
        
        const endDate = event.end_date 
            ? new Date(event.end_date).toLocaleString('pl-PL', formatOptions) 
            : "Brak ustalonej daty zakończenia";

        const embed = new EmbedBuilder()
            .setColor(event.is_major ? 0xFFD700 : "#72B01D") 
            .setTitle(`📌  ${event.name}`)
            .setAuthor({ name: tournamentName, url: tournamentUrl })
            .addFields(
                { 
                    name: "Ważność", 
                    value: event.is_major ? "Duże wydarzenie" : "Małe wydarzenie", 
                    inline: false 
                },
                { 
                    name: "Początek", 
                    value: startDate, 
                    inline: false 
                },
                { 
                    name: "Koniec", 
                    value: endDate, 
                    inline: false 
                }
            );

        // using editReply instead of reply because we deferred earlier.
        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error("Error fetching upcoming event:", error);
        await interaction.editReply("Wystąpił błąd podczas pobierania danych.");
    }
}