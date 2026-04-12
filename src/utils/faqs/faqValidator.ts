import { FAQ_CAMPOS_POR_TIPO , FaqType } from "../../types/faq";

export function isValidDateFormat(value: string):boolean{
    const regex =  /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(regex);
    if(!match) return false;

    const day = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10);
    const year = parseInt(match[3]!, 10);

    if(month < 1 || month > 12) return false;
    if(day < 1 || day > 31) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    if(day > daysInMonth) return false;

    return true;
}

export function isValidUrl(value:string): boolean {
    try{
        new URL(value);
        return true;
    }catch{
        return false;
    }
}

export function isValidCampoForTipo(campo: string, tipo: string): boolean{
    if(!(tipo in FAQ_CAMPOS_POR_TIPO)) return false;

    const faqTipo = tipo as FaqType;
    const campos = FAQ_CAMPOS_POR_TIPO[faqTipo];

    return campos.includes(campo);
}
