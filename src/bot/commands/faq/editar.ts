import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {FAQ_TIPO_CHOICES, FaqType} from "../../../types/faq";
import {isAdmin} from "../../../utils/permissions/permissions";
import {createOrUpdatePresetFaq, getFaqById} from "../../../backend/services/faqService";
import {isValidCampoForTipo, isValidDateFormat, isValidUrl} from "../../../utils/faqs/faqValidator";

export const faqEditarCommand = {
    data: new SlashCommandBuilder()
        .setName('faq-editar')
        .setDescription('Editar una FAQ existente')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('ID de la FAQ a editar')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('tipo')
                .setDescription('Tipo de FAQ')
                .addChoices(...FAQ_TIPO_CHOICES)
        )
        .addStringOption((option) =>
            option
                .setName('campo')
                .setDescription('Campo a modificar')
                .setAutocomplete(true)
        )
        .addStringOption((option) =>
            option
                .setName('valor')
                .setDescription('Nuevo valor')
        )
        .addStringOption((option) =>
            option
                .setName('descripcion')
                .setDescription('Descripcion')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if(!interaction.guildId){
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores',
                ephemeral: true,
            });
        }

        const isUserAdmin = await isAdmin(interaction);
        if(!isUserAdmin){
            return interaction.reply({
                content: 'No tenes permisos para editar FAQs',
                ephemeral: true,
            });
        }

        const id = interaction.options.getString('id', true);
        const tipo = interaction.options.getString('tipo') as FaqType | null;
        const campo = interaction.options.getString('campo');
        const valor = interaction.options.getString('valor');
        const descripcion = interaction.options.getString('descripcion');

        const faq = await getFaqById(id);

        if(!faq){
            return interaction.reply({
                content: `No se encontró ninguna FAQ con ID "${id}"`,
                ephemeral: true,
            });
        }

        if(faq.guildId !== interaction.guildId){
            return interaction.reply({
                content: 'Esta FAQ no pertenece a este servidor',
                ephemeral: true,
            });
        }

        const faqTipo = tipo || faq.tipo;
        if(faqTipo === FaqType.INFO_TP || faqTipo === FaqType.CUSTOM){
            const modal = new ModalBuilder()
                .setCustomId(`faq-editar-modal-${id}-${faqTipo}`);

            if(faqTipo === FaqType.INFO_TP) {
                const currentData = faq.dataJson ? JSON.parse(faq.dataJson) : {contenido: ''};

                const contenidoInput = new TextInputBuilder()
                    .setCustomId('contenido')
                    .setLabel('Contenido del TP')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(currentData.contenido || '')
                    .setRequired(true);

                const contenidoRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(contenidoInput);

                modal
                    .setTitle('Editar FAQ - Info TP')
                    .addComponents(contenidoRow);
            }else{
                const currentData = faq.dataJson ? JSON.parse(faq.dataJson) : {titulo: '', contenido: ''};

                const tituloInput = new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel('Titulo de la FAQ')
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentData.titulo || '')
                    .setRequired(true);

                const contenidoInput = new TextInputBuilder()
                    .setCustomId('contenido')
                    .setLabel('Respuesta')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(currentData.contenido || '')
                    .setRequired(true);

                const tituloRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(tituloInput);

                const contenidoRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(contenidoInput);

                modal.setTitle('Editar FAQ - Custom')
                    .addComponents(tituloRow, contenidoRow);
            }
            return interaction.showModal(modal);
        }

        if(!campo || !valor){
            return interaction.reply({
                content:'Para tipos estructurados, debes especificar "campo" y "valor"',
                ephemeral: true,
            });
        }

        const isValidCampo = isValidCampoForTipo(campo, faqTipo);
        if(!isValidCampo){
            return interaction.reply({
                content:`El campo "${campo}" no es válido para el tipo "${tipo}"`,
                ephemeral: true,
            });
        }

        if(faqTipo === FaqType.FECHAS_PARCIALES || faqTipo === FaqType.FECHAS_CHECKPOINT){
            if(!isValidDateFormat(valor)){
                return interaction.reply({
                    content:'El valor debe ser una fecha válida en formato DD/MM/AAAA',
                    ephemeral: true,
                });
            }
        }

        if(faqTipo === FaqType.LINKS_IMPORTANTES){
            if(!isValidUrl(valor)){
                return interaction.reply({
                    content: 'El valor debe ser una URL válida',
                    ephemeral: true,
                });
            }
        }

        try{
            await createOrUpdatePresetFaq(interaction.guildId, faqTipo, campo, valor,descripcion ?? undefined);
            return interaction.reply({
                content: `✅ FAQ "${faq.titulo}" actualizada correctamente.`,
                ephemeral: false,
            });
        }catch(e){
            console.error('Error al editar FAQ',e);
            return interaction.reply({
                content:'Ocurrió un error al editar la FAQ',
                ephemeral: true,
            });
        }
    },
};
