require("dotenv").config();

const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("auto-controle")
    .setDescription("Configura e verifica a estrutura do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("configurar")
        .setDescription("Cria e organiza a estrutura")
    )
    .addSubcommand(s =>
      s.setName("corrigir")
        .setDescription("Corrige a estrutura do servidor")
    )
    .addSubcommand(s =>
      s.setName("verificar")
        .setDescription("Verifica a estrutura")
    ),

  new SlashCommandBuilder()
    .setName("fila")
    .setDescription("Gerencia as filas")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("criar")
        .setDescription("Cria uma nova fila")
        .addStringOption(o =>
          o.setName("formato")
            .setDescription("Formato da partida")
            .setRequired(true)
            .addChoices(
              { name: "Mobile", value: "mobile" },
              { name: "Emulador", value: "emu" }
            )
        )
        .addStringOption(o =>
          o.setName("tipo")
            .setDescription("Tipo da fila")
            .setRequired(true)
            .addChoices(
              { name: "1x1", value: "1x1" },
              { name: "2x2", value: "2x2" },
              { name: "3x3", value: "3x3" },
              { name: "4x4", value: "4x4" }
            )
        )
        .addStringOption(o =>
          o.setName("modo")
            .setDescription("Modo da partida")
            .setRequired(true)
            .addChoices(
              { name: "Mobile", value: "mobile" },
              { name: "Emulador", value: "emu" }
            )
        )
        .addNumberOption(o =>
          o.setName("valor")
            .setDescription("Valor da fila")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(200)
        )
        .addIntegerOption(o =>
          o.setName("jogadores")
            .setDescription("Quantidade máxima de jogadores")
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(20)
        )
        .addStringOption(o =>
          o.setName("emoji")
            .setDescription("Emoji da fila")
            .setRequired(false)
        )
        .addStringOption(o =>
          o.setName("cor")
            .setDescription("Cor hexadecimal, exemplo #ED1C24")
            .setRequired(false)
        )
    )
    .addSubcommand(s =>
      s.setName("listar")
        .setDescription("Lista as filas")
    )
    .addSubcommand(s =>
      s.setName("limpar")
        .setDescription("Limpa as filas registradas")
    ),

  new SlashCommandBuilder()
    .setName("adm")
    .setDescription("Gerencia a escala de ADM")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("online")
        .setDescription("Fica online como mediador")
    )
    .addSubcommand(s =>
      s.setName("offline")
        .setDescription("Fica offline como mediador")
    )
    .addSubcommand(s =>
      s.setName("lista")
        .setDescription("Mostra os mediadores")
    ),

  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("Gerencia o PIX")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("configurar")
        .setDescription("Configura sua chave PIX")
        .addStringOption(o =>
          o.setName("chave")
            .setDescription("Sua chave PIX")
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName("nome")
            .setDescription("Nome do recebedor")
            .setRequired(false)
        )
        .addStringOption(o =>
          o.setName("cidade")
            .setDescription("Cidade do recebedor")
            .setRequired(false)
        )
    )
    .addSubcommand(s =>
      s.setName("status")
        .setDescription("Verifica seu PIX")
    )
    .addSubcommand(s =>
      s.setName("qr")
        .setDescription("Gera o QR Code PIX")
    )
    .addSubcommand(s =>
      s.setName("resetar")
        .setDescription("Remove seu PIX")
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gerencia os tickets")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("painel")
        .setDescription("Envia o painel de tickets")
    ),

  new SlashCommandBuilder()
    .setName("sorteio")
    .setDescription("Gerencia sorteios")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName("criar")
        .setDescription("Cria um sorteio")
        .addStringOption(o =>
          o.setName("premio")
            .setDescription("Prêmio do sorteio")
            .setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName("minutos")
            .setDescription("Duração em minutos")
            .setRequired(true)
            .setMinValue(1)
        )
        .addIntegerOption(o =>
          o.setName("vencedores")
            .setDescription("Quantidade de vencedores")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(s =>
      s.setName("encerrar")
        .setDescription("Encerra um sorteio")
    ),

  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Mostra seu perfil"),

  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel administrativo")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Registrando comandos slash...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Comandos registrados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
    process.exit(1);
  }
})();
