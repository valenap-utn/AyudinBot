import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { isAdmin } from "../../../utils/permissions/permissions";
import { searchDocumentsByContent } from "../../../backend/services/pdfService";

export const buscarPdfCommand = {
    data: new SlashCommandBuilder()
        .setName("buscar-pdf")
        .setDescription("[INTERNAL TESTING] Busca un texto dentro de los documentos PDF almacenados.")
        .addStringOption((option) =>
            option
                .setName("texto")
                .setDescription("Texto a buscar dentro del contenido de los documentos")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {

        // Validar que el comando se ejecute dentro de un servidor
        if (!interaction.guildId) {
            await interaction.reply({
                content: "Este comando solo puede usarse en servidores.",
                ephemeral: true,
            });
            return;
        }

        // Validar permisos de administrador
        if (!(await isAdmin(interaction))) {
            await interaction.reply({
                content: "No tienes permisos para usar este comando.",
                ephemeral: true,
            });
            return;
        }

        // Obtener el texto ingresado por el usuario
        const searchTerm = interaction.options.getString("texto", true);

        try {
            // Buscar documentos que contengan el texto
            const documents = await searchDocumentsByContent(interaction.guildId, searchTerm);

            // Si no hay resultados
            if (documents.length === 0) {
                await interaction.reply({
                    content: "No se encontraron documentos que contengan ese texto.",
                    ephemeral: true,
                });
                return;
            }

            // Formatear resultados en lista
            const results = documents
                .map((doc, index) => `${index + 1}. ${doc.originalName}`)
                .join("\n");

            // Enviar resultados al usuario
            await interaction.reply({
                content: `Resultados:\n${results}`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error al buscar documentos:", error);
            await interaction.reply({
                content: "Ocurrió un error al buscar los documentos. Intenta nuevamente más tarde.",
                ephemeral: true,
            });
        }
    },
};