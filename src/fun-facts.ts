import { Client, TextChannel, NewsChannel } from "discord.js";
import cron from "node-cron";
import { config } from "./config";

export interface TriviaItem {
    id: number;
    content: string;
    is_used: boolean;
    used_at?: string | null;
    created_at: string;
    created_by?: string | null;
}

export function startFunFactsSystem(client: Client) {
    // Schedule for every Thursday at 19:00
    // cron format: "minute hour day-of-month month day-of-week"
    // "0 19 * * 4" -> 19:00 every Thursday
    cron.schedule("0 19 * * 4", () => {
        console.log("⏰ [FunFacts] Uruchamianie zaplanowanego zadania publikacji ciekawostki (Czwartek 19:00)...");
        sendNextFunFact(client);
    }, {
        timezone: "Europe/Warsaw"
    });

    console.log("✅ [FunFacts] System ciekawostek zainicjalizowany (harmonogram: każdy czwartek o 19:00).");
}

export async function sendNextFunFact(client: Client): Promise<{ success: boolean; message: string; triviaId?: number }> {
    try {
        if (!config.WEB_API_KEY) {
            const msg = "Brak skonfigurowanego klucza WEB_API_KEY w zmiennych środowiskowych.";
            console.error(`❌ [FunFacts] ${msg}`);
            return { success: false, message: msg };
        }

        // 1. Pobierz najstarszą nieużytą ciekawostkę z kolejki FIFO
        const fetchUrl = `${config.WEB_API_URL}/api/admin/trivia?next=true`;
        const res = await fetch(fetchUrl, {
            method: "GET",
            headers: {
                "x-trivia-api-key": config.WEB_API_KEY,
                "x-web-api-key": config.WEB_API_KEY,
                "Authorization": `Bearer ${config.WEB_API_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            const msg = `Błąd API KKOL podczas pobierania ciekawostki [${res.status}]: ${errText}`;
            console.error(`❌ [FunFacts] ${msg}`);
            return { success: false, message: msg };
        }

        const data = (await res.json()) as { trivia: TriviaItem | null; message?: string };
        const trivia = data?.trivia;

        if (!trivia) {
            const msg = "Kolejka ciekawostek w panelu administratora jest pusta. Pomijam wysyłkę.";
            console.log(`ℹ️ [FunFacts] ${msg}`);
            return { success: false, message: msg };
        }

        // 2. Pobierz kanał docelowy Discord
        const channel = await client.channels.fetch(config.DISCORD_TARGET_FUN_FACTS_CHANNEL_ID);
        if (!channel || !((channel instanceof TextChannel) || (channel instanceof NewsChannel))) {
            const msg = "Kanał docelowy dla ciekawostek nie został znaleziony lub nie jest kanałem tekstowym.";
            console.error(`❌ [FunFacts] ${msg}`);
            return { success: false, message: msg };
        }

        // 3. Formatuj i wyślij na Discord
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateString = `${dd}.${mm}.${yyyy}`;

        await channel.send({
            content: `**Ciekawostka ${dateString}**\n${trivia.content}`
        });

        console.log(`✅ [FunFacts] Wysłano ciekawostkę #${trivia.id} na Discord.`);

        // 4. Oznacz ciekawostkę jako opublikowaną w bazie KKOL
        try {
            const patchRes = await fetch(`${config.WEB_API_URL}/api/admin/trivia`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-trivia-api-key": config.WEB_API_KEY,
                    "x-web-api-key": config.WEB_API_KEY,
                    "Authorization": `Bearer ${config.WEB_API_KEY}`
                },
                body: JSON.stringify({
                    id: trivia.id,
                    is_used: true
                })
            });

            if (!patchRes.ok) {
                const patchErr = await patchRes.text().catch(() => "");
                console.warn(`⚠️ [FunFacts] Ciekawostka #${trivia.id} wysłana na Discord, ale nie udało się zaktualizować statusu w API KKOL [${patchRes.status}]: ${patchErr}`);
            } else {
                console.log(`✅ [FunFacts] Ciekawostka #${trivia.id} pomyślnie oznaczona jako opublikowana.`);
            }
        } catch (patchErr) {
            console.error(`⚠️ [FunFacts] Błąd sieci podczas aktualizacji statusu ciekawostki #${trivia.id}:`, patchErr);
        }

        return {
            success: true,
            message: `Pomyślnie opublikowano ciekawostkę #${trivia.id}.`,
            triviaId: trivia.id
        };
    } catch (error: any) {
        const msg = `Nieoczekiwany błąd podczas publikowania ciekawostki: ${error?.message || error}`;
        console.error(`❌ [FunFacts] ${msg}`);
        return { success: false, message: msg };
    }
}
