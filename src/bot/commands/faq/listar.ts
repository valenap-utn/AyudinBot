import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {FAQ_TIPO_CHOICES} from "../../../types/faq";
import {getFaqsByGuild} from "../../../backend/services/faqService";
import {FaqType} from "@prisma/client";

export const faqListarCommand = {
    data: new SlashCommandBuilder()
        .setName('faq-listar')
        .setDescription('Listar todas las FAQs del servidor')
        .addStringOption((option) =>
        option
            .setName('tipo')
            .setDescription('Filtrar por tipo')
            .addChoices(...FAQ_TIPO_CHOICES)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if(!interaction.guildId){
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores',
                ephemeral: true,
            });
        }
        const tipo = interaction.options.getString('tipo') as FaqType | null;

        try{
            const faqs = await getFaqsByGuild(interaction.guildId, tipo || undefined);
            if(faqs.length === 0){
                return interaction.reply({
                    content: 'No hay FAQs disponibles en este servidor',
                    ephemeral: false,
                });
            }
            const embed = new EmbedBuilder()
                .setTitle('📋FAQs Disponibles')
                .setColor(0x5865F2)
                .setTimestamp();

            for(const faq of faqs){
                const tipoLabel = FAQ_TIPO_CHOICES.find(c=> c.value === faq.tipo)?.name || faq.tipo;
                const preview = faq.contenido.length > 100
                    ? faq.contenido.substring(0, 100) + '...'
                    : faq.contenido;

                embed.addFields({
                    name: `ID: ${faq.id} | ${faq.titulo}`,
                    value: `**Tipo:** ${tipoLabel}\n**Contenido:** ${preview}`,
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: false,
            });
        }catch(err){
            console.error('Error en /faq-listar:',err);
            return interaction.reply({
                content: 'Ocurrió un error al listar las FAQs',
                ephemeral: true,
            });
        }
    },
};
