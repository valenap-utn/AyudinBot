import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildConfig } from '../../../backend/services/guildService';
import {saveDocument, updateDocumentContent} from '../../../backend/services/pdfService';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { Buffer } from 'buffer';
import { isAdmin } from "../../../utils/permissions/permissions";
import {extractTextFromPdf} from "../../../backend/services/pdfParserService";

export const subirPdfCommand = {
    data: new SlashCommandBuilder()
        .setName('subir-pdf')
        .setDescription('Sube un PDF al canal de materiales configurado')
        .addAttachmentOption(option =>
            option
                .setName('archivo')
                .setDescription('El archivo PDF que quieres subir')
                .setRequired(true)
        )
        .addStringOption(option =>
        option
            .setName('categoria')
            .setDescription('Categoria de la fuente')
            .addChoices(
                { name: 'TP', value: 'TP'},
                { name: 'Administrativo', value: 'ADMINISTRATIVA'},
                { name: 'Teoria', value: 'TEORIA'}
            )
            .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const { guild, channel, options, user } = interaction;

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

        // Validar canal configurado
        const config = await getGuildConfig(guild.id);
        if (!config?.materialsChannelId) {
            await interaction.reply({ content: 'No hay un canal de materiales configurado. Usa /configurar-canal primero.', ephemeral: true });
            return;
        }
        if (config.materialsChannelId !== channel?.id) {
            await interaction.reply({ content: 'Este comando solo puede usarse en el canal de materiales configurado.', ephemeral: true });
            return;
        }

        // Validar archivo adjunto
        const attachment = options.getAttachment('archivo');
        if (!attachment || !attachment.name?.toLowerCase().endsWith('.pdf')) {
            await interaction.reply({ content: 'Por favor sube un archivo PDF válido.', ephemeral: true });
            return;
        }
        if (attachment.contentType && !attachment.contentType.includes('application/pdf')) {
            await interaction.reply({ content: 'El archivo adjunto no parece ser un PDF.', ephemeral: true });
            return;
        }

        const categoria = options.getString('categoria') as 'TP' | 'ADMINISTRATIVA' | 'TEORIA';

        await interaction.deferReply({ ephemeral: false });
        try{
            // Descargar y guardar archivo
            const response = await fetch(attachment.url);
            if (!response.ok) {
                await interaction.editReply({
                    content: 'Hubo un problema al descargar el archivo. Intenta nuevamente.',
                    // ephemeral: true
                });
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(new Uint8Array(arrayBuffer));

            // Generar un nombre único y seguro
            const storedName = `${randomUUID()}.pdf`;
            const path = `./storage/pdfs/${storedName}`;
            fs.mkdirSync('./storage/pdfs', {recursive: true});
            fs.writeFileSync(path, buffer);

            // Guardar metadata
            const document = await saveDocument({
                guildId: guild.id,
                originalName: attachment.name,
                storedName,
                path,
                uploadedByUserId: user.id,
                questionCategory: categoria,
            });

            // Extraer texto de PDF y actualizar el contenido del documento
            try {
                const extractedText = await extractTextFromPdf(path);
                await updateDocumentContent(document.id, extractedText);
            } catch (error) {
                console.error(`Error al extraer texto del PDF ${document.id}:`, error);
            }

            // Responder
            await interaction.editReply({
                content: `El archivo **${document.originalName}** se ha subido correctamente.`,
                // ephemeral: false
            });
        }catch (e){
            console.error('Error en /subir-pdf:', e);
            await interaction.editReply('Ocurrió un error al procesar el PDF. Intenta nuevamente.')
        }
    }
};