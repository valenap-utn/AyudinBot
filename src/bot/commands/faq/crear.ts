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
import {isValidCampoForTipo, isValidDateFormat, isValidUrl} from "../../../utils/faqs/faqValidator";
import {createOrUpdatePresetFaq} from "../../../backend/services/faqService";

export const faqCrearCommand = {
    data: new SlashCommandBuilder()
        .setName('faq-crear')
        .setDescription('Crear a una nueva FAQ')
        .addStringOption((option) =>
        option
            .setName('tipo')
            .setDescription('Tipo de FAQ')
            .setRequired(true)
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
                .setDescription('Valor del campo')
        )
        .addStringOption((option) =>
            option
                .setName('descripcion')
                .setDescription('Descripción (solo para links)')
        ),

    async execute(interaction: ChatInputCommandInteraction){
        if(!interaction.guildId){
            return interaction.reply({
                content: 'Este comando solo puede usarse en servidores',
                ephemeral: true,
            });
        }

        const isUserAdmin = await isAdmin(interaction);
        if(!isUserAdmin){
            return interaction.reply({
                content: 'No tienes permisos para crear FAQs',
                ephemeral: true,
            });
        }

        const tipo = interaction.options.getString('tipo') as FaqType;
        const campo = interaction.options.getString('campo');
        const valor = interaction.options.getString('valor');
        const descripcion = interaction.options.getString('descripcion');

        if(tipo === FaqType.INFO_TP || tipo === FaqType.CUSTOM){
            const modal = new ModalBuilder()
                .setCustomId(`faq-crear-modal-${tipo}`);
            if(tipo === FaqType.INFO_TP) {
                const contenidoInput = new TextInputBuilder()
                    .setCustomId('contenido')
                    .setLabel('Contenido del TP')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Escribe la información del TP...');

                const contenidoRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(contenidoInput);

                modal
                    .setTitle('Crear FAQ - Info TP')
                    .addComponents(contenidoRow);
            }else {
                const tituloInput = new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel('Título de la FAQ')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Cuál es la pregunta?');

                const contenidoInput = new TextInputBuilder()
                    .setCustomId('contenido')
                    .setLabel('Respuesta')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Escribe la respuesta...')

                const tituloRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(tituloInput);

                const contenidoRow = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(contenidoInput);

                modal
                    .setTitle('Crear FAQ - Custom')
                    .addComponents(tituloRow, contenidoRow);
            }
            return interaction.showModal(modal);
        }

        if(!campo){
            return interaction.reply({
                content: 'Debes seleccionar el campo que quieres actualizar para este tipo de FAQ',
                ephemeral: true,
            });
        }

        if(!valor){
            return interaction.reply({
                content: 'Debes ingresar un valor para el campo seleccionado',
                ephemeral: true,
            });
        }

        const isValidCampo = isValidCampoForTipo(campo,tipo);
        if(!isValidCampo){
            return interaction.reply({
                content: `El campo "${campo}" no es válido para el tipo "${tipo}"`,
                ephemeral: true,
            });
        }

        if(tipo === FaqType.FECHAS_PARCIALES || tipo === FaqType.FECHAS_CHECKPOINT){
            if(!isValidDateFormat(valor)){
                return interaction.reply({
                    content: `El valor debe ser una fecha válida en formato DD/MM/AAAA`,
                    ephemeral: true,
                });
            }
        }

        if(tipo === FaqType.LINKS_IMPORTANTES){
            if(!isValidUrl(valor)){
                return interaction.reply({
                    content: `El valor debe ser una URL válida`,
                    ephemeral: true,
                });
            }
        }

        try{
            await createOrUpdatePresetFaq(interaction.guildId, tipo, campo, valor, descripcion ?? undefined);
            return interaction.reply({
                content: `✅FAQ de tipo "${tipo}" actualizada correctamente`,
                ephemeral: false,
            });
        }catch(err){
            console.error('Error al crear FAQ:',err);
            return interaction.reply({
                content: 'Ocurrió un error al crear la FAQ',
                ephemeral: true,
            });
        }
    },
};
