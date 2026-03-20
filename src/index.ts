import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { setupEvents, registerCommands } from "./bot";

// Conecta variables de entorno, inicializa el cliente,
// y delega responsabilidades a setupEvents y registerCommands

config(); // Cargar variables de entorno
const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
    throw new Error("Error: Falta la variable de entorno DISCORD_TOKEN.");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds], // Intents básicos requeridos
});

// Registrar eventos del bot
setupEvents(client);

// Conectar el cliente a la API de Discord
client.login(DISCORD_TOKEN).catch(console.error);

// (Opcional) Registrar comandos al iniciar
registerCommands().catch(console.error);