import {ChatInputCommandInteraction, GuildMemberRoleManager, PermissionFlagsBits} from "discord.js";
import {getGuildConfig} from "../../backend/services/guildService";

export async function isAdmin(
    interaction: ChatInputCommandInteraction
): Promise<boolean> {
    const hasAdministratorPermission =
        interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    if (hasAdministratorPermission) {
        return true;
    }

    if (!interaction.guildId || !interaction.member) {
        return false;
    }

    const guildConfig = await getGuildConfig(interaction.guildId);

    if (!guildConfig?.adminRoleId) {
        return false;
    }

    const memberRoles = interaction.member.roles;

    if (!memberRoles || typeof memberRoles === "string") {
        return false;
    }

    return (memberRoles as GuildMemberRoleManager).cache.has(guildConfig.adminRoleId);
}