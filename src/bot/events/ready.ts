import { Client } from "discord.js";

// Archivo que confirmara que el bot está conectado y funcionando

export const readyEvent = (client: Client) => {
    client.once("ready", () => {
        console.log(`${client.user?.tag} está en línea y listo para usar.`);
    });
};