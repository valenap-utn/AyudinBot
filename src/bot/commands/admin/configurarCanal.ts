import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import {updateMaterialsChannel,updateQuestionsChannel} from "../../../backend/services/guildService";
import { isAdmin } from "../../../utils/permissions/permissions";

export const configurarCanalCommand = {
    data: new SlashCommandBuilder()
        .setName("configurar-canal")
        .setDescription("Configura un canal para el bot")
        .addStringOption((option) =>
            option
                .setName("tipo")
                .setDescription("Tipo de canal a configurar")
                .setRequired(true)
                .addChoices(
                    { name: "Materials", value: "materials" },
                    { name: "Questions", value: "questions" }
                )
        )
        .addChannelOption((option) =>
            option
                .setName("canal")
                .setDescription("Canal a configurar")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        try{
            if (!interaction.guildId) {
                await interaction.reply({
                    content: "Este comando solo puede usarse en un servidor.",
                    ephemeral: true,
                });
                return;
            }

            if (!(await isAdmin(interaction))) {
                await interaction.reply({
                    content: "No tienes permisos de administrador.",
                    ephemeral: true,
                });
                return;
            }

            const tipo = interaction.options.getString("tipo", true);
            const canal = interaction.options.getChannel("canal", true);

            if (tipo === "materials") {
                await updateMaterialsChannel(interaction.guildId, canal.id);
                await interaction.reply({
                    content: `Canal de materiales configurado como: ${canal.name}`,
                    ephemeral: true,
                });
                return;
            }

            if (tipo === "questions") {
                await updateQuestionsChannel(interaction.guildId, canal.id);
                await interaction.reply({
                    content: `Canal de preguntas configurado como: ${canal.name}`,
                    ephemeral: true,
                });
            }
        }catch(error) {
            console.error("Error en configurar-canal:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Ocurrió un error al configurar el canal.",
                    ephemeral: true,
                });
            }
        }
    }
};
