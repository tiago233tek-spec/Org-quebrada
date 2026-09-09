require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder().setName("auto-controle").setDescription("Organiza e verifica toda a estrutura do Duck ORG")
    .addSubcommand(s=>s.setName("configurar").setDescription("Cria a estrutura inicial"))
    .addSubcommand(s=>s.setName("verificar").setDescription("Verifica a estrutura"))
    .addSubcommand(s=>s.setName("corrigir").setDescription("Corrige e recria o que estiver faltando")),
  new SlashCommandBuilder().setName("fila").setDescription("Gerencia filas")
    .addSubcommand(s=>s.setName("criar").setDescription("Cria uma fila")
      .addStringOption(o=>o.setName("formato").setDescription("Ex.: 1x1, 2x2, 3x3, 4x4").setRequired(true))
      .addStringOption(o=>o.setName("tipo").setDescription("Ex.: Normal").setRequired(true))
      .addStringOption(o=>o.setName("modo").setDescription("Mobile ou EMU").setRequired(true).addChoices({name:"Mobile",value:"mobile"},{name:"EMU",value:"emu"}))
      .addNumberOption(o=>o.setName("valor").setDescription("Valor da fila").setRequired(true).setMinValue(0))
      .addIntegerOption(o=>o.setName("jogadores").setDescription("Quantidade máxima de jogadores").setRequired(true).setMinValue(2).setMaxValue(16))
      .addStringOption(o=>o.setName("emoji").setDescription("Emoji da fila"))
      .addStringOption(o=>o.setName("cor").setDescription("Cor HEX, ex. #ED1C24")))
    .addSubcommand(s=>s.setName("listar").setDescription("Lista as filas"))
    .addSubcommand(s=>s.setName("limpar").setDescription("Limpa o cadastro das filas")),
  new SlashCommandBuilder().setName("adm").setDescription("Gerencia mediadores")
    .addSubcommand(s=>s.setName("online").setDescription("Ficar online"))
    .addSubcommand(s=>s.setName("offline").setDescription("Ficar offline"))
    .addSubcommand(s=>s.setName("lista").setDescription("Ver escala")),
  new SlashCommandBuilder().setName("pix").setDescription("Gerencia sua chave PIX")
    .addSubcommand(s=>s.setName("configurar").setDescription("Cadastrar chave PIX")
      .addStringOption(o=>o.setName("chave").setDescription("Chave PIX").setRequired(true))
      .addStringOption(o=>o.setName("nome").setDescription("Nome do recebedor"))
      .addStringOption(o=>o.setName("cidade").setDescription("Cidade do recebedor")))
    .addSubcommand(s=>s.setName("status").setDescription("Ver status do PIX"))
    .addSubcommand(s=>s.setName("qr").setDescription("Gerar QR Code PIX estático"))
    .addSubcommand(s=>s.setName("resetar").setDescription("Remover dados PIX")),
  new SlashCommandBuilder().setName("ticket").setDescription("Gerencia tickets")
    .addSubcommand(s=>s.setName("painel").setDescription("Enviar painel de tickets")),
  new SlashCommandBuilder().setName("sorteio").setDescription("Gerencia sorteios")
    .addSubcommand(s=>s.setName("criar").setDescription("Criar sorteio")
      .addStringOption(o=>o.setName("premio").setDescription("Prêmio").setRequired(true))
      .addIntegerOption(o=>o.setName("minutos").setDescription("Duração em minutos").setRequired(true).setMinValue(1))
      .addIntegerOption(o=>o.setName("vencedores").setDescription("Número de vencedores").setRequired(true).setMinValue(1).setMaxValue(20)))
    .addSubcommand(s=>s.setName("encerrar").setDescription("Encerrar sorteio")),
  new SlashCommandBuilder().setName("painel").setDescription("Abre o painel administrativo"),
  new SlashCommandBuilder().setName("perfil").setDescription("Mostra seu perfil")
].map(x=>x.toJSON());

const rest = new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);
(async()=>{
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {body:commands});
  console.log("✅ Comandos registrados.");
})().catch(console.error);
