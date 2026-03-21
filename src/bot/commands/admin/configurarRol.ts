import {ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits,} from "discord.js";
import { getGuildConfig, updateAdminRole } from "../../../backend/services/guildService";
import {isAdmin} from "../../../utils/permissions/permissions";

export const configurarRolCommand = {
    data: new SlashCommandBuilder()
        .setName("configurar-rol")
        .setDescription("Configura el rol administrador del bot en este servidor")
        .addRoleOption((option) =>
            option
                .setName("rol")
                .setDescription("Rol que podrá usar todos los comandos administrativos")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            if (!interaction.guildId || !interaction.guild) {
                await interaction.reply({
                    content: "Este comando solo puede usarse dentro de un servidor.",
                    ephemeral: true,
                });
                return;
            }

            const canManage =
                interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
                (await isAdmin(interaction));

            if (!canManage) {
                await interaction.reply({
                    content:
                        "No tienes permisos para ejecutar este comando.",
                    ephemeral: true,
                });
                return;
            }

            const newRole = interaction.options.getRole("rol", true);
            const guildConfig = await getGuildConfig(interaction.guildId);

            if (guildConfig?.adminRoleId) {
                const existingRole = interaction.guild.roles.cache.get(guildConfig.adminRoleId);

                if (existingRole) {
                    await interaction.reply({
                        content: `Ya existe un rol administrador configurado: ${existingRole}. No se puede asignar otro mientras ese rol siga existiendo.`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            await updateAdminRole(interaction.guildId, newRole.id);

            await interaction.reply({
                content: `Rol administrador configurado correctamente: ${newRole}`,
                ephemeral: false,
            });
        } catch (error) {
            console.error("Error en configurar-rol:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Ocurrió un error al configurar el rol administrador.",
                    ephemeral: true,
                });
            }
        }
    },
};