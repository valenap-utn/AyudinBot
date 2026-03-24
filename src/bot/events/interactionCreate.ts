import {ChatInputCommandInteraction, Client, Interaction, SlashCommandBuilder} from "discord.js";
import { pingCommand } from "../commands/ping";
import { configurarRolCommand } from "../commands/admin/configurarRol";
import { configurarCanalCommand } from "../commands/admin/configurarCanal";
import {subirPdfCommand} from "../commands/admin/subirPdf";
import {listarPdfsCommand} from "../commands/admin/listarPdfs";
import {eliminarPdfCommand} from "../commands/admin/eliminarPdf";
import {buscarPdfCommand} from "../commands/admin/buscarPdf";
import {preguntarCommand} from "../commands/public/preguntar";

// Encargado de manejar los comandos /slash (si se agrega alguno nuevo => lo agrego acá)

const commands = {
    ping: pingCommand,
    "configurar-rol": configurarRolCommand,
    "configurar-canal": configurarCanalCommand,
    "subir-pdf": subirPdfCommand,
    "listar-pdfs": listarPdfsCommand,
    "eliminar-pdf": eliminarPdfCommand,
    "buscar-pdf": buscarPdfCommand,
    "preguntar": preguntarCommand,
};

export const interactionEvent = (client: Client) => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command =
            commands[interaction.commandName as keyof typeof commands];

        if (!command) {
            await interaction.reply({
                content: "Comando no reconocido.",
                ephemeral: true,
            });
            return;
        }

        try {
            if (!(command instanceof SlashCommandBuilder)) {
                await command.execute(interaction as ChatInputCommandInteraction);
            }
        } catch (error) {
            console.error(`Error ejecutando /${interaction.commandName}:`, error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Ocurrió un error al ejecutar el comando.",
                    ephemeral: true,
                });
            }
        }
    });
};