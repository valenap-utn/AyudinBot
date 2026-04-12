import {
    ChatInputCommandInteraction,
    Client,
    Interaction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import {pingCommand} from "../commands/ping";
import {configurarRolCommand} from "../commands/admin/configurarRol";
import {configurarCanalCommand} from "../commands/admin/configurarCanal";
import {subirPdfCommand} from "../commands/admin/subirPdf";
import {listarPdfsCommand} from "../commands/admin/listarPdfs";
import {eliminarPdfCommand} from "../commands/admin/eliminarPdf";
import {buscarPdfCommand} from "../commands/admin/buscarPdf";
import {preguntarCommand} from "../commands/public/preguntar";
import {configurarForoCommand} from "../commands/admin/configurarForo";
import {faqCrearCommand, faqEditarCommand, faqEliminarCommand, faqListarCommand} from "../commands/faq";
import {FaqType} from "../../types/faq";
import {createFaq, getFaqById, updateFaq} from "../../backend/services/faqService";
import {formatByTipo} from "../../utils/faqs/faqFormatter";
import {handleFaqAutocomplete} from "../autocomplete/faqAutocomplete";

// Encargado de manejar los comandos /slash (si se agrega alguno nuevo => lo agrego acá)

type BotCommand = {
    data:
        | SlashCommandBuilder
        | SlashCommandOptionsOnlyBuilder
        | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
};

const commands: Record<string, BotCommand> = {
    // ping: pingCommand,
    "configurar-rol": configurarRolCommand,
    "configurar-canal": configurarCanalCommand,
    "subir-pdf": subirPdfCommand,
    "listar-pdfs": listarPdfsCommand,
    "eliminar-pdf": eliminarPdfCommand,
    "buscar-pdf": buscarPdfCommand,
    "preguntar": preguntarCommand,
    "configurar-foro": configurarForoCommand,
    "faq-crear": faqCrearCommand,
    "faq-listar": faqListarCommand,
    "faq-editar": faqEditarCommand,
    "faq-eliminar": faqEliminarCommand,
};

export const interactionEvent = (client: Client) => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        try {
            //Autocomplete
            if (interaction.isAutocomplete()) {
                if (interaction.commandName === 'faq-crear' || interaction.commandName === 'faq-editar') {
                    await handleFaqAutocomplete(interaction);
                }
                return;
            }

            //Modal submit
            if (interaction.isModalSubmit()) {
                const customId = interaction.customId;

                if (customId.startsWith('faq-crear-modal-')) {
                    const tipo = customId.replace('faq-crear-modal-', '') as FaqType;

                    if (!interaction.guildId) {
                        await interaction.reply({
                            content: 'Este modal solo puede usarse en servidores',
                            ephemeral: true,
                        });
                        return;
                    }

                    if (tipo === FaqType.INFO_TP) {
                        const contenido = interaction.fields.getTextInputValue('contenido');
                        const formatted = formatByTipo(FaqType.INFO_TP, {contenido});

                        await createFaq({
                            guildId: interaction.guildId,
                            tipo: FaqType.INFO_TP,
                            titulo: formatted.titulo,
                            contenido: formatted.contenido,
                            dataJson: formatted.dataJson,
                        });
                    } else if (tipo === FaqType.CUSTOM) {
                        const titulo = interaction.fields.getTextInputValue('titulo');
                        const contenido = interaction.fields.getTextInputValue('contenido');
                        const formatted = formatByTipo(FaqType.CUSTOM, {titulo, contenido});

                        await createFaq({
                            guildId: interaction.guildId,
                            tipo: FaqType.CUSTOM,
                            titulo: formatted.titulo,
                            contenido: formatted.contenido,
                            dataJson: formatted.dataJson,
                        });
                    }

                    await interaction.reply({
                        content: '✅ FAQ creada correctamente.',
                        ephemeral: false,
                    });
                    return;
                }

                if (customId.startsWith('faq-editar-modal-')) {
                    const raw = customId.replace('faq-editar-modal', '');
                    const lastDashIndex = raw.lastIndexOf('-');

                    if (lastDashIndex === -1) {
                        await interaction.reply({
                            content: 'Modal inválido',
                            ephemeral: true,
                        });
                        return;
                    }
                    const id = raw.slice(0, lastDashIndex);
                    const tipo = raw.slice(lastDashIndex + 1) as FaqType;

                    const faq = await getFaqById(id);

                    if (!faq) {
                        await interaction.reply({
                            content: 'FAQ no encontrada',
                            ephemeral: true,
                        });
                        return;
                    }

                    if (tipo === FaqType.INFO_TP) {
                        const contenido = interaction.fields.getTextInputValue('contenido');
                        const formatted = formatByTipo(FaqType.INFO_TP, {contenido});

                        await updateFaq(id, {
                            titulo: formatted.titulo,
                            contenido: formatted.contenido,
                            dataJson: formatted.dataJson,
                        });
                    } else if (tipo === FaqType.CUSTOM) {
                        const titulo = interaction.fields.getTextInputValue('titulo');
                        const contenido = interaction.fields.getTextInputValue('contenido');
                        const formatted = formatByTipo(FaqType.CUSTOM, {titulo, contenido});

                        await updateFaq(id, {
                            titulo: formatted.titulo,
                            contenido: formatted.contenido,
                            dataJson: formatted.dataJson,
                        });
                    }

                    await interaction.reply({
                        content: '✅ FAQ editada correctamente',
                        ephemeral: false,
                    });
                    return;
                }
                return;
            }

            // Chat Input Command
            if (!interaction.isChatInputCommand()) return;

            const command = commands[interaction.commandName];

            if (!command) {
                await interaction.reply({
                    content: "Comando no reconocido.",
                    ephemeral: true,
                });
                return;
            }

            await command.execute(interaction);
        } catch (err) {
            console.error(`Error en interactionCreate:`, err);

            try {
                if (interaction.isRepliable()) {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply('Ocurrió un error al ejecutar la interacción')
                    } else {
                        await interaction.reply({
                            content: 'Ocurrió un error al ejecutar la interacción',
                            ephemeral: true,
                        });
                    }
                }
            } catch (err) {
                console.error('Error enviando respuesta de error:', err);
            }
        }
    });
};