import { prisma } from "../../database/prisma/client";
import * as fs from "node:fs";
import path from "node:path";

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

// Obtiene los últimos 10 documentos ordenados por uploadedAt DESC
export const getRecentDocumentsByGuild = async (guildId: string, limit: number): Promise<DocumentMetadata[]> => {
    return prisma.document.findMany({
        where: { guildId },
        orderBy: { uploadedAt: "desc" },
        take: limit,
    });
};

// Eliminar un documento específico por guildId y originalName
export const deleteDocumentByName = async (
    guildId: string,
    originalName: string
): Promise<"not_found" | "duplicated" | "deleted"> => {

    const documents = await prisma.document.findMany({
        where: { guildId, originalName },
    });

    if (documents.length === 0) {
        return "not_found"; // No se encontró el documento
    }

    if (documents.length > 1) {
        return "duplicated"; // Existen múltiples documentos con el mismo nombre
    }

    const document = documents[0];

    // Eliminar archivo físico
    // @ts-ignore
    const filePath = path.join(__dirname, "../../../storage/pdfs", document.storedName);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            // @ts-ignore
            console.error(`Error al eliminar archivo físico: ${document.storedName}`, err);
        }
    }

    // Eliminar registro en la base de datos
    // @ts-ignore
    await prisma.document.delete({ where: { id: document.id } });

    return "deleted"; // Eliminación exitosa
};

// Actualiza el contenido de un Documento en la base de datos
export const updateDocumentContent = async (documentId: string, content: string) => {
    try {
        return await prisma.document.update({
            where: { id: documentId },
            data: { content },
        });
    } catch (error) {
        console.error(`Error al actualizar contenido del documento con ID ${documentId}`, error);
        throw error;
    }
};

// Busca documentos por contenido textual en base al guildId
export const searchDocumentsByContent = async (guildId: string, searchTerm: string) => {
    return prisma.document.findMany({
        where: {
            guildId,
            content: {
                contains: searchTerm,
            },
        },
        select: {
            originalName: true,
        },
        take: 10,
        orderBy: {
            uploadedAt: "desc",
        },
    });
};
