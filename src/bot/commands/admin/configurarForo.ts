import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {isAdmin} from "../../../utils/permissions/permissions";
import 'dotenv/config';
import {syncGithubIssues} from "../../../backend/services/githubService";

export const configurarForoCommand = {
    data: new SlashCommandBuilder()
        .setName("configurar-foro")
        .setDescription("Sincroniza issues de Github como fuente de conocimiento")
        .addStringOption((option)=>
            option.setName("repositorio")
                .setDescription("Repositorio en formato owner/repo") // ???
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction){
        if(!interaction.guildId){
            await interaction.reply({
                content: "Este comando solo puede usarse en servidores",
                ephemeral: true,
            });
            return;
        }
        if(!(await isAdmin(interaction))){
            await interaction.reply({
                content: "No tienes permisos para usar este comando",
                ephemeral: true,
            });
            return;
        }

        const repo = interaction.options.getString("repositorio",true);
        const [owner, repoName] = repo.split("/");

        if(!owner || !repoName){
            await interaction.reply({
                content: "Formato invalido. Usa: owner/repo",
                ephemeral: true,
            });
            return;
        }

        const token = process.env.GITHUB_TOKEN;
        if(!token){
            await interaction.reply({
                content: "No hay GITHUB_TOKEN configurado en el servidor",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply();

        try{
            const result = await syncGithubIssues({
                owner,
                repo: repoName,
                guildId: interaction.guildId,
                token,
            });

            await interaction.editReply({
                content: `✅ Configuración completada:\n• Nuevos: ${result.added}\n• Actualizados: ${result.updated}\n• Omitidos: ${result.skipped}`,
            });

        } catch (error) {
            console.error("Error al configurar foro:", error);
            await interaction.editReply({
                content: "❌ Error al sincronizar con GitHub. Verificá el formato del repo.",
            });
        }
    }
};
