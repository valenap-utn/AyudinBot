import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { deleteDocumentByName } from "../../../backend/services/pdfService";
import {isAdmin} from "../../../utils/permissions/permissions";


export const eliminarPdfCommand = {
    data: new SlashCommandBuilder()
        .setName("eliminar-pdf")
        .setDescription("Elimina un documento existente.")
        .addStringOption((option) =>
            option
                .setName("archivo")
                .setDescription("Nombre del archivo a eliminar (ej. algebra.pdf)")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const archivo = interaction.options.getString("archivo", true);
        const guildId = interaction.guild?.id;

        // Validar permisos
        if (!(await isAdmin(interaction))) {
            await interaction.reply({
                content: "No tienes permisos para usar este comando.",
                ephemeral: true,
            });
            return;
        }

        if (!guildId) {
            await interaction.reply({
                content: "Este comando solo se puede usar en servidores.",
                ephemeral: true,
            });
            return;
        }
        const result = await deleteDocumentByName(guildId, archivo);

        switch (result) {
            case "not_found":
                await interaction.reply({
                    content: "No se encontró un documento con ese nombre.",
                    ephemeral: true,
                });
                break;
            case "duplicated":
                await interaction.reply({
                    content: "Hay múltiples documentos con ese nombre. Esta operación aún no puede resolver duplicados.",
                    ephemeral: true,
                });
                break;
            case "deleted":
                await interaction.reply({
                    content: `El documento **${archivo}** fue eliminado correctamente.`,
                    ephemeral: true,
                });
                break;
        }
    },
};