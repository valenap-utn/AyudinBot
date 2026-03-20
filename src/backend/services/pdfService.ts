import { prisma } from "../../database/prisma/client";

// Almacena y recupera los metadatos del PDF

   export interface DocumentMetadata {
    guildId: string;
    originalName: string;
    storedName: string;
    path: string;
    uploadedAt?: Date;
    uploadedByUserId: string;
}
export const saveDocument = async (data: DocumentMetadata) => {
    return prisma.document.create({ data });
};
export const getDocumentsByGuild = async (guildId: string) => {
    return prisma.document.findMany({ where: { guildId } });
};
