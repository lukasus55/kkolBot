import { Client, TextChannel, NewsChannel } from "discord.js";
import cron from "node-cron";
import { config } from "./config";

export interface FunFact {
    date: string; // Format: "DD.MM.YYYY"
    content: string;
    dataDate?: string; // Optional: The date the data was collected (e.g. "27.08.2026")
}

// FORMATTING INSTRUCTIONS:
// 1. You can add new fun facts here. The bot checks this list based on the date.
// 2. The date must be exactly in "DD.MM.YYYY" format.
// 3. For multiline text, wrap your content in backticks (`).
export const funFacts: FunFact[] = [
    {
        date: "27.08.2026",
        content: `Dni od samodzielnego wygrania głównej konkurencji (za wyłączeniem ex aequo):
- **Kostyś** - 64 dni
- **Kukuła** - 95 dni
- **Harnoldihno** - 133 dni
- **DamiDami2** - nigdy`,
        dataDate: "25.08.2026"
    },
    {
        date: "03.09.2026",
        content: `Ilość zdobytych punktów na przestrzeni wszystkich sezonów
- **Kostyś** - 39 pkt
- **Harnoldihno** - 34 pkt
- **Kukuła** - 32 pkt
- **DamiDami2** - 30 pkt`,
        dataDate: "25.08.2026"
    },
    {
        date: "10.09.2026",
        content: `Ilość miejsc ex aequo w całej historii:
- **Harnoldihno** - 5
- **Kostyś** - 4
- **DamiDami2** - 3
- **Kukuła** - 3`,
        dataDate: "25.08.2026"
    },
    {
        date: "17.09.2026",
        content: `Gdyby nie podwójne punkty za ostatnią konkurencje klasyfikacja końcowa w 2024 wyglądałaby następująco:
- **1) Harnoldihno** - 14 pkt
- **2) Kostyś** - 12 pkt
- **2) Kukuła** - 12 pkt
- **4) DamiDami2** - 10 pkt`,
        dataDate: "25.08.2026"
    },
    {
        date: "24.09.2026",
        content: `Ilość zdobytych punktów na przestrzeni wszystkich sezonów gdyby odbywały się tylko gry wideo
- **Kostyś** - 24 pkt
- **Harnoldihno** - 21 pkt
- **DamiDami2** - 16 pkt
- **Kukuła** - 15 pkt`, //(kinect, codenames, brain show, geometry dash, golf with your friends, pummel party)
        dataDate: "25.08.2026"
    }
];

// Pomysły:
// Dni od samodzielnego przegrania (4 miejsce) głównej konkurencji (za wyłączeniem ex aequo)
// Dodać ciekawostke o najdłuższych przerwach miedzy konkurencja (za wylaczeniem przerwy miedzysezonowej)
// Dodać ciekawostke o ilości głosów jakie otrzymał CS na przestrzein 3 głosowań na gry
// Ilość zdobytych punktów na przestrzeni wszystkich sezonów gdyby odbywały się tylko gry planszowe / z kategorii inne

export function startFunFactsSystem(client: Client) {
    // Schedule for every Thursday at 19:00
    // cron format: "minute hour day-of-month month day-of-week"
    // "0 19 * * 4" -> 19:00 every Thursday
    cron.schedule("0 19 * * 4", () => {
        sendFunFactForToday(client);
    }, {
        timezone: "Europe/Warsaw"
    });

    // --- REMOVE THE CODE BELOW BEFORE PUSHING TO PROD ---
    // Test logic to send all 6 facts on startup
    // console.log("TESTING FUN FACTS SYSTEM (remove before prod): Sending all facts...");
    // sendAllFactsForTesting(client);
    // --- REMOVE THE CODE ABOVE BEFORE PUSHING TO PROD ---
}

async function sendAllFactsForTesting(client: Client) {
    try {
        const channel = await client.channels.fetch(config.DISCORD_TARGET_FUN_FACTS_CHANNEL_ID);
        if (!channel || !((channel instanceof TextChannel) || (channel instanceof NewsChannel))) {
            console.error("Fun facts: Target channel not found or is not a text channel.");
            return;
        }

        for (const fact of funFacts) {
            const footer = fact.dataDate ? `\n\n*[Dane na ${fact.dataDate}]*` : "";
            await channel.send({
                content: `**Ciekawostka ${fact.date}**\n${fact.content}${footer}`
            });
        }
    } catch (error) {
        console.error("Error during test fun facts sending:", error);
    }
}

async function sendFunFactForToday(client: Client) {
    try {
        const today = new Date();
        // Format to DD.MM.YYYY
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateString = `${dd}.${mm}.${yyyy}`;

        const fact = funFacts.find(f => f.date === dateString);

        if (!fact) {
            console.log(`No fun fact assigned for today (${dateString}). Skipping.`);
            return;
        }

        const channel = await client.channels.fetch(config.DISCORD_TARGET_CHANNEL_ID);
        if (!channel || !((channel instanceof TextChannel) || (channel instanceof NewsChannel))) {
            console.error("Fun facts: Target channel not found or is not a text channel.");
            return;
        }

        const footer = fact.dataDate ? `\n\n*[Dane na ${fact.dataDate}]*` : "";
        await channel.send({
            content: `**Ciekawostka ${dateString}**\n${fact.content}${footer}`
        });

        console.log(`✅ Sent fun fact for ${dateString}`);
    } catch (error) {
        console.error("❌ Error sending fun fact:", error);
    }
}
