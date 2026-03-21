import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { isAdmin } from '../../../utils/permissions/permissions';
import { getRecentDocumentsByGuild } from '../../../backend/services/pdfService';

export const listarPdfsCommand = {
    data: new SlashCommandBuilder()
        .setName('listar-pdfs')
        .setDescription('Lista los documentos subidos en este servidor'),

    async execute(interaction: ChatInputCommandInteraction) {
        const { guild } = interaction;

        // Validar entorno de servidor
        if (!guild) {
            await interaction.reply({ content: 'Este comando no se puede usar en mensajes directos.', ephemeral: true });
            return;
        }

        // Validar permisos administrativos
        if (!await isAdmin(interaction)) {
            await interaction.reply({ content: 'No tienes permisos para usar este comando.', ephemeral: true });
            return;
        }

        // Obtener los últimos 10 documentos del servidor
        const documents = await getRecentDocumentsByGuild(guild.id, 10);

        // Si no hay documentos
        if (documents.length === 0) {
            await interaction.reply({ content: 'No hay documentos registrados en este servidor.', ephemeral: true });
            return;
        }

        // Generar la lista de documentos
        const response = documents.map((doc, index) => {
            const fecha = doc.uploadedAt?.toISOString().split('T')[0] ?? 'Desconocida';
            return `${index + 1}. ${doc.originalName}\n   Subido por: <@${doc.uploadedByUserId}>\n   Fecha: ${fecha}`;
        }).join('\n\n');

        // Responder con la lista generada
        await interaction.reply({
            content: `Documentos recientes:\n\n${response}`,
            ephemeral: false
        });
    },
};