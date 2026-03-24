import { interactionEvent } from "./events/interactionCreate";
import { readyEvent } from "./events/ready";
import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { pingCommand } from "./commands/ping";
import { configurarRolCommand } from "./commands/admin/configurarRol";
import { configurarCanalCommand} from "./commands/admin/configurarCanal";
import { subirPdfCommand } from "./commands/admin/subirPdf";
import {listarPdfsCommand} from "./commands/admin/listarPdfs";
import {eliminarPdfCommand} from "./commands/admin/eliminarPdf";
import {buscarPdfCommand} from "./commands/admin/buscarPdf";
import {preguntarCommand} from "./commands/public/preguntar";

/*
    Archivo responsable de exportar:
        1. setupEvents(client) para conectar los eventos ready e interactionCreate
        2. registerCommands() para manejar el registro de comandos /slash
*/

config(); // Cargar variables de entorno
const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;
const GUILD_ID = "1483967472481734817"; // ID del servidor para pruebas

// Conectar eventos al cliente de Discord
export const setupEvents = (client: any) => {
    readyEvent(client);
    interactionEvent(client);
};

// Registrar comandos en Discord
export const registerCommands = async () => {
    if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
        throw new Error("Faltan DISCORD_TOKEN o DISCORD_CLIENT_ID en las variables de entorno.");
    }

    const commands = [
        pingCommand.toJSON(),
        configurarRolCommand.data.toJSON(),
        configurarCanalCommand.data.toJSON(),
        subirPdfCommand.data.toJSON(),
        listarPdfsCommand.data.toJSON(),
        eliminarPdfCommand.data.toJSON(),
        buscarPdfCommand.data.toJSON(),
        preguntarCommand.data.toJSON(),
    ];

    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
    try {
        console.log("Registrando comandos slash en el servidor de pruebas...");
        await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log("Comandos slash registrados exitosamente.");
    } catch (error) {
        console.error("Error al registrar comandos:", error);
    }
};
