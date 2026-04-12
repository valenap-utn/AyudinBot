import {AutocompleteInteraction} from "discord.js";
import {FAQ_CAMPOS_POR_TIPO, FaqType} from "../../types/faq";

export async function handleFaqAutocomplete(interaction: AutocompleteInteraction): Promise<void>{
    const tipo = interaction.options.getString('tipo') as FaqType | null;
    const campoValue = interaction.options.getString('campo') || '';

    if(!tipo){
        await interaction.respond([]);
        return;
    }

    const camposValidos = FAQ_CAMPOS_POR_TIPO[tipo] || [];

    if(camposValidos.length === 0){
        await interaction.respond([]);
        return;
    }

    const filtered = camposValidos
        .filter(campo => campo.toLowerCase().includes(campoValue.toLowerCase()))
        .slice(0,25)
        .map(campo => ({name: campo, value: campo}));

    await interaction.respond(filtered);
}
