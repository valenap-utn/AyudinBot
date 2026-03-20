import {ChatInputCommandInteraction, Client, Interaction, SlashCommandBuilder} from "discord.js";
import { pingCommand } from "../commands/ping";
import { configurarRolCommand } from "../commands/admin/configurarRol";
import { configurarCanalCommand } from "../commands/admin/configurarCanal";

// Encargado de manejar los comandos /slash (si se agrega alguno nuevo => lo agrego acá)

const commands = {
    ping: pingCommand,
    "configurar-rol": configurarRolCommand,
    "configurar-canal": configurarCanalCommand,
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