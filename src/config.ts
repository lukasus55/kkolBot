import dotenv from "dotenv";

dotenv.config();

const {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_TARGET_CHANNEL_ID,
    DISCORD_TARGET_FUN_FACTS_CHANNEL_ID,
    WEB_API_KEY,
    WEB_API_URL
} = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_TARGET_CHANNEL_ID || !DISCORD_TARGET_FUN_FACTS_CHANNEL_ID) {
    throw new Error("Missing environment variables");
}

export const config = {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_TARGET_CHANNEL_ID,
    DISCORD_TARGET_FUN_FACTS_CHANNEL_ID,
    WEB_API_KEY: WEB_API_KEY || "",
    WEB_API_URL: (WEB_API_URL || "https://kkol.pl").replace(/\/$/, "")
};