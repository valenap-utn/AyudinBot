import {
    Faq,
    CreateFaqInput,
    UpdateFaqInput,
    FaqType,
    FAQ_PRESET_TYPES,
    LINK_DESCRIPCIONES_POR_DEFECTO, SearchFaqResult
} from "../../types/faq";
import {prisma} from "../../database/prisma/client";
import {formatByTipo, getEmptyDataForTipo} from "../../utils/faqs/faqFormatter";

function normalizeText(text: string): string{
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text: string): string[]{
    return normalizeText(text).split(/\s+/).filter(t=>t.length > 0);
}

export async function createFaq(input: CreateFaqInput): Promise<Faq>{
    const faq = await prisma.faq.create({
        data: input,
    });
    return faq as Faq;
}

export async function updateFaq(id: string, input: UpdateFaqInput): Promise<Faq>{
    const faq = await prisma.faq.update({
        where: {id},
        data: input,
    });
    return faq as Faq;
}

export async function deleteFaq(id: string): Promise<void>{
    await prisma.faq.delete({ where: {id},});
}

export async function getFaqsByGuild(guildId: string, tipo?: FaqType): Promise<Faq[]>{
    const faqs = await prisma.faq.findMany({
        where: {
            guildId,
            ...(tipo ? {tipo}:{}),
        },
        orderBy: { createdAt: 'asc' },
    });
    return faqs as Faq[];
}

export async function getFaqById(id: string): Promise<Faq | null>{
    const faq = await prisma.faq.findUnique({
        where: { id },
    });
    return faq as Faq | null;
}

function isPresetTipo(tipo: FaqType): boolean{
    return (FAQ_PRESET_TYPES as readonly FaqType[]).includes(tipo);
}

export async function createOrUpdatePresetFaq(guildId: string, tipo: FaqType, campo:string, valor: string, descripcion?:string): Promise<Faq> {
    if(!isPresetTipo(tipo)){
        throw new Error('createOrUpdatePresetFaq solo para tipos preset');
    }

    const existing = await prisma.faq.findFirst({
        where: {guildId,tipo},
    });

     let currentData: any = existing?.dataJson ? JSON.parse(existing.dataJson) : getEmptyDataForTipo(tipo);

     if(tipo === FaqType.LINKS_IMPORTANTES){
         if(!currentData.links) currentData.links = {};
         currentData.links[campo] = {
             url: valor,
             descripcion: descripcion || LINK_DESCRIPCIONES_POR_DEFECTO[campo] || campo,
         };
     }else {
         currentData[campo] = valor;
     }

     const formatted = formatByTipo(tipo, currentData);

     if(existing){
         return (await prisma.faq.update({
             where: {id: existing.id},
             data: {
                 titulo: formatted.titulo,
                 contenido: formatted.contenido,
                 dataJson: formatted.dataJson,
             },
         })) as Faq;
     }

     return (await prisma.faq.create({
         data:{
             guildId,
             tipo,
             titulo: formatted.titulo,
             contenido: formatted.contenido,
             dataJson: formatted.dataJson,
         },
     })) as Faq;
}

export async function searchFaqs(guildId: string, query: string): Promise<SearchFaqResult | null>{
    const faqs = await getFaqsByGuild(guildId);

    if(faqs.length === 0) return null;

    const queryTokens = tokenize(query);
    let bestMatch: { faq: Faq; score: number } | null = null;

    for(const faq of faqs){
        const titleTokens = tokenize(faq.titulo);
        const contentTokens = tokenize(faq.contenido);

        let score = 0;

        for(const qt of queryTokens){
            if(titleTokens.some(t => t.includes(qt) || qt.includes(t))) {
                score += 10;
            }
            if(contentTokens.some(t => t.includes(qt) || qt.includes(t))) {
                score += 1;
            }
        }
        if(score > 0 && (!bestMatch || score > bestMatch.score)){
            bestMatch = {faq,score};
        }
    }
    if(!bestMatch) return null;

    return {
        id: bestMatch.faq.id,
        titulo: bestMatch.faq.titulo,
        contenido: bestMatch.faq.contenido,
        tipo: bestMatch.faq.tipo,
        score: bestMatch.score,
    };
}
