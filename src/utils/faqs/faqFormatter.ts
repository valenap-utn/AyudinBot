import {FaqType} from "../../types/faq";

export interface FaqFormatted {
    titulo:string;
    contenido: string;
    dataJson: string;
}

interface FechasParcialesData{
    fecha_primer_parcial: string;
    fecha_segundo_parcial: string;
    fecha_primer_recu_primer_parcial: string;
    fecha_primer_recu_segundo_parcial: string;
    fecha_segundo_recu_primer_parcial: string;
    fecha_segundo_recu_segundo_parcial: string;
}

interface FechasCheckpointData {
    checkpoint_1: string;
    checkpoint_2: string;
    checkpoint_3: string;
}

interface LinkItem {
    url: string;
    descripcion: string;
}

interface LinksData{
    links: Record<string, LinkItem>;
}

interface InfoTpData{
    contenido: string;
}

interface CustomData{
    titulo: string;
    contenido: string;
}

export function formatFechasParciales(data: FechasParcialesData): FaqFormatted{
    const lines = [
        '📅Fechas de parciales:',
        `• 1er parcial: ${data.fecha_primer_parcial} `,
        `• 2do parcial: ${data.fecha_segundo_parcial} `,
        `• 1er recu 1er parcial: ${data.fecha_primer_recu_primer_parcial} `,
        `• 1er recu 2do parcial: ${data.fecha_primer_recu_segundo_parcial} `,
        `• 2do recu 1er parcial: ${data.fecha_segundo_recu_primer_parcial} `,
        `• 2do recu 2do parcial: ${data.fecha_segundo_recu_segundo_parcial} `,
    ];
    return {
        titulo: 'Fechas de Parciales',
        contenido: lines.join('\n'),
        dataJson: JSON.stringify(data),
    };
}

export function formatFechasCheckpoint(data: FechasCheckpointData): FaqFormatted{
    const lines = [
        '⏳Fechas de Checkpoint:',
        `• Checkpoint 1: ${data.checkpoint_1}`,
        `• Checkpoint 2: ${data.checkpoint_2}`,
        `• Checkpoint 3: ${data.checkpoint_3}`,
    ];
    return {
        titulo: 'Fechas de Checkpoint',
        contenido: lines.join('\n'),
        dataJson: JSON.stringify(data),
    };
}

export function formatLinksImportantes(data: LinksData):FaqFormatted{
    const lines = ['🔗Links importantes:'];
    for(const [key,link] of Object.entries(data.links)){
        lines.push(`• ${link.descripcion}: ${link.url}`);
    }
    return{
        titulo: 'Links Importantes:',
        contenido: lines.join('\n'),
        dataJson: JSON.stringify(data),
    };
}

export function formatInfoTp(data: InfoTpData): FaqFormatted{
    return{
        titulo: 'Info TP',
        contenido: data.contenido,
        dataJson: JSON.stringify(data),
    };
}

export function formatCustom(data: CustomData): FaqFormatted {
    return{
        titulo: data.titulo,
        contenido: data.contenido,
        dataJson: JSON.stringify(data),
    }
}

export function formatByTipo(tipo: FaqType, data:any): FaqFormatted{
    switch(tipo){
        case FaqType.FECHAS_PARCIALES:
            return formatFechasParciales((data as FechasParcialesData));
        case FaqType.FECHAS_CHECKPOINT:
            return formatFechasCheckpoint(data as FechasCheckpointData);
        case FaqType.LINKS_IMPORTANTES:
            return formatLinksImportantes(data as LinksData);
        case FaqType.INFO_TP:
            return formatInfoTp(data as InfoTpData);
        case FaqType.CUSTOM:
            return formatCustom(data as CustomData);
        default:
            throw new Error(`Tipo de FAQ desconocido: ${tipo}`);
    }
}

export function getEmptyDataForTipo(tipo: FaqType): any {
    switch (tipo) {
        case FaqType.FECHAS_PARCIALES:
            return {
                fecha_primer_parcial: '',
                fecha_segundo_parcial: '',
                fecha_primer_recu_primer_parcial: '',
                fecha_primer_recu_segundo_parcial: '',
                fecha_segundo_recu_primer_parcial: '',
                fecha_segundo_recu_segundo_parcial: '',
            };
        case FaqType.FECHAS_CHECKPOINT:
            return { checkpoint_1: '', checkpoint_2: '', checkpoint_3: '' };
        case FaqType.LINKS_IMPORTANTES:
            return { links: {} };
        case FaqType.INFO_TP:
            return { contenido: '' };
        case FaqType.CUSTOM:
            return { titulo: '', contenido: '' };
        default:
            return {};
    }
}
