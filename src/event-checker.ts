import { Client, NewsChannel, TextChannel } from "discord.js";
import { config } from "./config";
import { loadData } from "./helpers";

export const sentEventMessages = new Map<number, string>();

// Helper function to strictly format dates to "DD.MM (Dzień)" in Polish timezone
function formatPollDate(date: Date): string {
    const formatter = new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        day: '2-digit',
        month: '2-digit',
        weekday: 'long'
    });

    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    let weekday = parts.find(p => p.type === 'weekday')?.value || '';

    weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    return `${day}.${month} (${weekday})`;
}

export function startEventChecker(client: Client) {
    checkApiForEvents(client);

    const checkCooldown = 3600000 // 3600000 = 1hour

    setInterval(() => checkApiForEvents(client), checkCooldown);
}

async function checkApiForEvents(client: Client) {
    try {
        console.log("🔄 Checking API for upcoming events...");

        const events = await loadData("https://kkol.pl/api/events?format=list&upcoming=true&limit=1");
        if (!events || events.length === 0) return;

        const event = events[0];

        if (sentEventMessages.has(event.id)) {
            console.log(`Skipped - Message for ${event.id} already sent`)
            return; // Already sent, skip
        }

        const eventDate = new Date(event.event_date);
        const now = new Date();
        const xDaysFromNow = new Date();
        xDaysFromNow.setDate(now.getDate() + 6);

        if (eventDate <= xDaysFromNow && eventDate > now) {
            const messageId = await sendEventPoll(client, event);
            sentEventMessages.set(event.id, messageId);
            console.log(`✅ Wysłano ankietę dla wydarzenia ${event.id}. Message ID: ${messageId}`);
        }

    } catch (error) {
        console.error("❌ Błąd podczas sprawdzania API:", error);
    }
}

export async function sendEventPoll(client: Client, event: any): Promise<string> {
    const channel = await client.channels.fetch(config.DISCORD_TARGET_CHANNEL_ID);

    if (!channel || !((channel instanceof TextChannel) || (channel instanceof NewsChannel))) {
        throw new Error("Target channel not found or is not a text channel.");
    }

    const eventDate = new Date(event.event_date);
    const pollAnswers = [];
    for (let i = -1; i <= 8; i++) {
        const optionDate = new Date(eventDate.getTime());
        optionDate.setDate(optionDate.getDate() + i);

        pollAnswers.push({
            text: formatPollDate(optionDate) + (i == 0 ? ' - Oficjalny termin' : '')
        });
    }

    const message = await channel.send({
        content: `🚨 @everyone **Zbliża się wydarzenie: ${event.name}!**\nOficjalny termin: <t:${Math.floor(eventDate.getTime() / 1000)}:F>`,
        poll: {
            question: { text: "Wybierz preferowany termin (można wybrać kilka):" },
            answers: pollAnswers,
            allowMultiselect: true,
            duration: 72 // Duration is set in hours. 3 days * 24 hours = 72 hours
        }
    });

    return message.id;
}