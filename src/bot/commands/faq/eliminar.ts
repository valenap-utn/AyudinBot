import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {isAdmin} from "../../../utils/permissions/permissions";
import {deleteFaq, getFaqById} from "../../../backend/services/faqService";

export const faqEliminarCommand = {
    data: new SlashCommandBuilder()
        .setName("faq-eliminar")
        .setDescription('Eliminar una FAQ')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('ID de la FAQ a eliminar')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if(!interaction.guildId){
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores',
                ephemeral: true
            });
        }

        const isUserAdmin = await isAdmin(interaction);
        if(!isUserAdmin){
            return interaction.reply({
                content: 'No tenes permisos para eliminar FAQs',
                ephemeral: true,
            });
        }

        const id = interaction.options.getString('id',true);
        const faq = await getFaqById(id);
        if(!faq){
            return interaction.reply({
                content:`No se encontró ninguna FAQ con ID: ${id}`,
                ephemeral: true,
            });
        }

        if(faq.guildId !== interaction.guildId){
            return interaction.reply({
                content:'Esta FAQ no pertenece a este servidor',
                ephemeral: true,
            });
        }

        try{
            await deleteFaq(id);
            return interaction.reply({
                content:`✅ FAQ "${faq.titulo}" eliminada correctamente.`,
                ephemeral: false,
            });
        }catch (e) {
            console.error('Error al eliminar FAQ:', e);
            return interaction.reply({
                content: 'Ocurrió un error al eliminar la FAQ.',
                ephemeral: true,
            });
        }
    },
}
