import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {searchRelevantDocuments} from "../../../backend/services/pdfService";
import {getGuildConfig} from "../../../backend/services/guildService";

export const preguntarCommand = {
    data: new SlashCommandBuilder()
        .setName('preguntar')
        .setDescription('Haz una pregunta y encuentra respuestas relacionadas en los documentos cargados.')
        .addStringOption((option) =>
            option
                .setName('pregunta')
                .setDescription('Pregunta que deseas realizar.')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores.',
                ephemeral: true,
            });
        }
        const pregunta = interaction.options.getString('pregunta', true);

        // Validar canal de preguntas
        const guildConfig = await getGuildConfig(interaction.guildId);
        if (!guildConfig || !guildConfig.questionsChannelId) {
            return interaction.reply({
                content: 'No hay un canal de preguntas configurado. Usa /configurar-canal primero.',
                ephemeral: true,
            });
        }
        if (interaction.channelId !== guildConfig.questionsChannelId) {
            return interaction.reply({
                content: 'Este comando solo puede usarse en el canal de preguntas configurado.',
                ephemeral: true,
            });
        }

        try {
            // Buscar documentos relevantes
            const {results, totalMatches} = await searchRelevantDocuments(interaction.guildId, pregunta);
            if (results.length === 0) {
                return interaction.reply({
                    content: 'No encontré material relacionado con tu consulta en los documentos cargados.',
                    ephemeral: false,
                });
            }
            const response = results
                .map(
                    (result, index) => `${index + 1}. ${result.originalName}\n${result.snippet}`
                )
                .join('\n\n');

            const suffix = totalMatches > 3 ? `\n\n_Mostrando 3 de ${totalMatches} resultados._` : '';


            return interaction.reply({
                content: `Encontré material relacionado en:\n\n${response}${suffix}`,
                ephemeral: false,
            });

        } catch (error) {
            console.error('Error al procesar /preguntar:', error);
            if(interaction.replied || interaction.deferred){
                return interaction.editReply({
                    content: 'Ocurrió un error al buscar en los documentos. Intenta nuevamente más tarde.',
                    // ephemeral: true,
                });
            }
            return interaction.reply({
                content: 'Ocurrió un error al buscar en los documentos. Intenta nuevamente más tarde.',
                ephemeral: true,
            });
        }
    },
};

// ---------- Funciones auxiliares ----------

function truncateWithEllipsis(text: string, maxLength: number): string{
    if(maxLength <= 0) return '';
    if(text.length <= maxLength) return text;
    if(maxLength <= 3) return '.'.repeat(maxLength);

    return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildPreguntarResponse(results: {originalName: string, snippet: string}[], totalMatches: number): string {
    const maxLength = 2000;
    const header = 'Encontré material relacionado en:\n\n';
    const suffix = totalMatches > 3 ? `\n\n Mostrando ${results.length} de ${totalMatches} resultados._` : '';
    let message = header;

    for(let i = 0; i < results.length; i++){
        const result = results[i]!;
        const blockPrefix = i > 0 ? '\n\n' : '';
        const block = `${blockPrefix}${i+1}. ${result.originalName}\n${result.snippet}`;

        // Si entra completo junto con el suffix, lo agregamos entero
        if((message + block + suffix).length <= maxLength){
            message += block;
            continue;
        }

        // Si no entra completo, intentamos meter lo máximo posible de este bloque
        const remaining = maxLength - message.length - suffix.length;
        if(remaining > 0){
            message += truncateWithEllipsis(block,remaining);
        }
        break;
    }
    return message + suffix;
}