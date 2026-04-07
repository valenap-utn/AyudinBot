import { prisma } from "../../database/prisma/client";
import * as fs from "node:fs";
import path from "node:path";
import {QuestionCategory} from "@prisma/client";

// Almacena y recupera los metadatos del PDF

export interface DocumentMetadata {
    guildId: string;
    originalName: string;
    storedName: string;
    path: string;
    uploadedAt?: Date;
    uploadedByUserId: string;
    questionCategory?: QuestionCategory;
}

export const saveDocument = async (data: DocumentMetadata): Promise<DocumentMetadata & { id: string}> => {
    const source = await prisma.knowledgeSource.create({
        data:{
            guildId: data.guildId,
            title: data.originalName,
            storageKey: data.storedName,
            filePath: data.path,
            sourceType: "PDF",
            reliability: "MEDIUM",
            priority: 100,
            isActive: true,
            uploadedByUserId: data.uploadedByUserId,
            ...(data.questionCategory !== undefined
                ? { questionCategory: data.questionCategory }
                : {}),
        },
    });

    return {
        id: source.id,
        guildId: source.guildId,
        originalName: source.title,
        storedName: source.storageKey || "",
        path: source.filePath || "",
        uploadedAt: source.createdAt,
        uploadedByUserId: source.uploadedByUserId || "",
        ...(source.questionCategory !== null
            ? { questionCategory: source.questionCategory }
            : {}),
    };
};

export const getDocumentsByGuild = async (guildId: string) => {
    return prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
        },
    });
};

// Obtiene los últimos 10 documentos ordenados por uploadedAt DESC
export const getRecentDocumentsByGuild = async (guildId: string, limit: number): Promise<DocumentMetadata[]> => {
    const sources = await prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
        },
        orderBy:{ createdAt: "desc" },
        take: limit,
    });

    return sources.map((source) => ({
        guildId: source.guildId,
        originalName: source.title,
        storedName: source.storageKey || "",
        path: source.filePath || "",
        uploadedAt: source.createdAt,
        uploadedByUserId: source.uploadedByUserId || "",
    }));
};

// Eliminar un documento específico por guildId y originalName
export const deleteDocumentByName = async (
    guildId: string,
    originalName: string
): Promise<"not_found" | "duplicated" | "deleted"> => {

    const documents = await prisma.knowledgeSource.findMany({
        where: {
            guildId,
            title: originalName,
            sourceType: "PDF",
            isActive: true,
        },
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
    const filePath = path.join(__dirname, "../../../storage/pdfs", document.storageKey || "");
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            // @ts-ignore
            console.error(`Error al eliminar archivo físico: ${document.storageKey}`, err);
        }
    }

    // Eliminar registro en la base de datos
    // @ts-ignore
    await prisma.knowledgeSource.delete({ where: { id: document.id } });

    return "deleted"; // Eliminación exitosa
};

// Actualiza el contenido de un Documento en la base de datos
export const updateDocumentContent = async (documentId: string, content: string) => {
    try {
        return await prisma.knowledgeSource.update({
            where: { id: documentId },
            data: { extractedText: content },
        });
    } catch (error) {
        console.error(`Error al actualizar contenido del documento con ID ${documentId}`, error);
        throw error;
    }
};

// Busca documentos por contenido textual en base al guildId
export const searchDocumentsByContent = async (guildId: string, searchTerm: string) => {
    return prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
            extractedText: {
                contains: searchTerm,
            },
        },
        select: {
            title: true,
        },
        take: 10,
        orderBy: {
            createdAt: "desc",
        },
    });
};
