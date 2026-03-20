import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { updateAdminRole } from "../../../backend/services/guildService";
import { isAdmin } from "../../../utils/permissions/permissions";

export const configurarRolCommand = {
    data: new SlashCommandBuilder()
        .setName("configurar-rol")
        .setDescription("Configura el rol de administrador del bot en este servidor")
        .addRoleOption((option) =>
            option
                .setName("rol")
                .setDescription("Rol de administrador")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "Este comando solo puede usarse en un servidor.",
                ephemeral: true,
            });
            return;
        }

        if (!isAdmin(interaction)) {
            await interaction.reply({
                content: "No tienes permisos de administrador.",
                ephemeral: true,
            });
            return;
        }

        const role = interaction.options.getRole("rol", true);

        await updateAdminRole(interaction.guildId, role.id);

        await interaction.reply({
            content: `Rol admin configurado como: ${role.name}`,
            ephemeral: true,
        });
    },
};
