import fs from 'fs/promises';
import {PDFParse} from 'pdf-parse';

export async function extractTextFromPdf(filePath: string): Promise<string> {
    try {
        // Leer el archivo PDF como buffer
        const fileBuffer = await fs.readFile(filePath);

        // Inicializar el parser con el contenido del archivo
        const parser = new PDFParse({data: fileBuffer});

        // Extraer el texto del PDF
        const result = await parser.getText();
        await parser.destroy();

        return result.text;
    } catch (error) {
        console.error(`Error al extraer texto del PDF: ${filePath}`, error);
        throw error;
    }
}
