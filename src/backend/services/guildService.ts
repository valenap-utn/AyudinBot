import { prisma } from "../../database/prisma/client";

export async function getGuildConfig(guildId: string) {
    return prisma.guildConfig.findUnique({
        where: { guildId },
    });
}

export async function updateAdminRole(guildId: string, adminRoleId: string) {
    return prisma.guildConfig.upsert({
        where: { guildId },
        update: { adminRoleId },
        create: { guildId, adminRoleId },
    });
}

export async function updateMaterialsChannel(
    guildId: string,
    materialsChannelId: string
) {
    return prisma.guildConfig.upsert({
        where: { guildId },
        update: { materialsChannelId },
        create: { guildId, materialsChannelId },
    });
}

export async function updateQuestionsChannel(
    guildId: string,
    questionsChannelId: string
) {
    return prisma.guildConfig.upsert({
        where: { guildId },
        update: { questionsChannelId },
        create: { guildId, questionsChannelId },
    });
}