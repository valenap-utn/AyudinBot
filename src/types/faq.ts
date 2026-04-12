import type { $Enums } from "@prisma/client";
export type FaqType = $Enums.FaqType;

export const FaqType = {
    FECHAS_PARCIALES: 'FECHAS_PARCIALES',
    FECHAS_CHECKPOINT: 'FECHAS_CHECKPOINT',
    LINKS_IMPORTANTES: 'LINKS_IMPORTANTES',
    INFO_TP: 'INFO_TP',
    CUSTOM: 'CUSTOM',
} as const;

export const FAQ_PRESET_TYPES = [
    FaqType.FECHAS_PARCIALES,
    FaqType.FECHAS_CHECKPOINT,
    FaqType.LINKS_IMPORTANTES,
    FaqType.INFO_TP,
] as const;

export const FAQ_CAMPOS_POR_TIPO: Record <FaqType, string[]> = {
    [FaqType.FECHAS_PARCIALES]: [
        'fecha_primer_parcial',
        'fecha_segundo_parcial',
        'fecha_primer_recu_primer_parcial',
        'fecha_primer_recu_segundo_parcial',
        'fecha_segundo_recu_primer_parcial',
        'fecha_segundo_recu_segundo_parcial',
    ],
    [FaqType.FECHAS_CHECKPOINT]: ['checkpoint_1','checkpoint_2','checkpoint_3'],
    [FaqType.LINKS_IMPORTANTES]: ['formulario_tp','discord','web'],
    [FaqType.INFO_TP]: [],
    [FaqType.CUSTOM]: [],
}

export const LINK_DESCRIPCIONES_POR_DEFECTO: Record<string, string> = {
    formulario_tp: 'Formulario TP',
    discord: 'Servidor de Discord',
    web: 'Web materia',
}

export const FAQ_TIPO_CHOICES = [
    {name: 'Fechas Parciales', value: FaqType.FECHAS_PARCIALES},
    {name: 'Fechas Checkpoint', value: FaqType.FECHAS_CHECKPOINT},
    {name: 'Links Importantes', value: FaqType.LINKS_IMPORTANTES},
    {name: 'Info TP', value: FaqType.INFO_TP},
    {name: 'Custom', value: FaqType.CUSTOM},
] as const;

export interface Faq{
    id: string;
    guildId: string;
    tipo: FaqType;
    titulo: string;
    contenido: string;
    dataJson: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFaqInput {
    guildId: string;
    tipo: FaqType;
    titulo: string;
    contenido: string;
    dataJson?: string;
}

export interface UpdateFaqInput {
    titulo?: string;
    contenido?: string;
    dataJson?: string;
}

export interface SearchFaqResult {
    id: string;
    titulo: string;
    contenido: string;
    tipo: FaqType;
    score: number;
}
