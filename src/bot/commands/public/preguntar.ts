import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {getGuildConfig} from "../../../backend/services/guildService";
import {searchService} from "../../../backend/services/searchService";
import {buildPreguntarResponse} from "../../../utils/preguntarFormatter";
import {QuestionCategory} from "../../../types/search";
import {searchFaqs} from "../../../backend/services/faqService";

export const preguntarCommand = {
    data: new SlashCommandBuilder()
        .setName('preguntar')
        .setDescription('Haz una pregunta y encuentra respuestas relacionadas en los documentos cargados.')
        .addStringOption((option) =>
            option
                .setName('pregunta')
                .setDescription('Pregunta que deseas realizar.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('tipo')
                .setDescription('Tipo de pregunta')
                .addChoices(
                    {name: 'TP', value:'TP'},
                    {name:'Administrativa', value:'ADMINISTRATIVA'},
                    {name: 'Teoria', value:'TEORIA'},
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores.',
                ephemeral: true,
            });
        }
        const pregunta = interaction.options.getString('pregunta', true);
        const tipo = interaction.options.getString('tipo') as QuestionCategory | null;

        if(interaction.guildId){
            const faqMatch = await searchFaqs(interaction.guildId, pregunta);

            if(faqMatch){
                return interaction.reply({
                    content: `📋 **${faqMatch.titulo}**\n${faqMatch.contenido}`,
                    ephemeral: false,
                });
            }
        }

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
            const {results, totalMatches} = await searchService.search({
                guildId: interaction.guildId,
                query: pregunta,
                ...(tipo !== null ? { questionCategory: tipo } : {}),
            });

            if (results.length === 0) {
                const noResultsMessage = getNoResultsMessage(tipo);
                return interaction.reply({
                    content: noResultsMessage,
                    ephemeral: false,
                });
            }
            const response = buildPreguntarResponse(results, totalMatches, pregunta, tipo || undefined);

            return interaction.reply({
                content: response,
                ephemeral: false,
            })

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

function getNoResultsMessage(tipo: QuestionCategory | null): string {
    switch (tipo) {
        case 'TP':
            return "No encontré resultados relacionados en fuentes del TP.";
        case 'ADMINISTRATIVA':
            return "No encontré información administratica relacionada."
        case 'TEORIA':
            return "No encontré material teórico relacionado."
        default:
            return "No encontré material relacionado con tu consulta en los documentos cargados.";
    }
}
