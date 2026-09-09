const {
  ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle
} = require("discord.js");
const { load, save } = require("./storage");

async function getOrCreateCategory(guild, name) {
  let c = guild.channels.cache.find(x => x.type === ChannelType.GuildCategory && x.name === name);
  if (!c) c = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  return c;
}
async function getOrCreateChannel(guild, name, parent) {
  let c = guild.channels.cache.find(x => x.type === ChannelType.GuildText && x.name === name && x.parentId === parent.id);
  if (!c) c = await guild.channels.create({ name, type: ChannelType.GuildText, parent: parent.id });
  return c;
}

async function autoControl(guild, bot) {
  const data = load();

  const filaCat = await getOrCreateCategory(guild, "🎮 FILAS");
  const ticketCat = await getOrCreateCategory(guild, "🎟️ TICKETS");
  const admCat = await getOrCreateCategory(guild, "🛡️ ADMINISTRAÇÃO");

  const filas = await getOrCreateChannel(guild, "filas", filaCat);
  const tickets = await getOrCreateChannel(guild, "abrir-ticket", ticketCat);
  const pix = await getOrCreateChannel(guild, "registrar-pix-adm", admCat);
  const status = await getOrCreateChannel(guild, "status-adm", admCat);
  const sorteios = await getOrCreateChannel(guild, "sorteios", admCat);
  const logs = await getOrCreateChannel(guild, "logs", admCat);

  data.categories = { filas: filaCat.id, tickets: ticketCat.id, admin: admCat.id };
  data.channels = {
    filas: filas.id, tickets: tickets.id, pix: pix.id,
    status: status.id, sorteios: sorteios.id, logs: logs.id
  };

  if (!data.adminRoleId) {
    const role = guild.roles.cache.find(r => r.name === "Duck • ADM") ||
      await guild.roles.create({ name: "Duck • ADM", color: "#5865F2", reason: "Duck ORG auto-controle" });
    data.adminRoleId = role.id;
  }
  if (!data.mediatorRoleId) {
    const role = guild.roles.cache.find(r => r.name === "Duck • Mediador") ||
      await guild.roles.create({ name: "Duck • Mediador", color: "#00A86B", reason: "Duck ORG auto-controle" });
    data.mediatorRoleId = role.id;
  }
  save(data);

  const avatar = bot.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setColor(data.color)
    .setAuthor({ name: data.brandName, iconURL: avatar })
    .setTitle("🎮 Painel de Filas")
    .setDescription("Use os botões das filas para entrar ou sair. As filas podem ser criadas pelo comando `/fila criar`.")
    .setFooter({ text: "Duck ORG • Auto-Controle" });

  await filas.send({ embeds: [embed] }).catch(() => {});
  await tickets.send({
    embeds: [new EmbedBuilder().setColor(data.color).setAuthor({name:data.brandName,iconURL:avatar}).setTitle("🎟️ Atendimento").setDescription("Abra um ticket para falar com a equipe.")],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_open").setLabel("Abrir Ticket").setEmoji("🎟️").setStyle(ButtonStyle.Primary)
    )]
  }).catch(() => {});

  await pix.send({
    embeds: [new EmbedBuilder().setColor(data.color).setAuthor({name:data.brandName,iconURL:avatar}).setTitle("💳 Gerenciamento chave PIX").setDescription("Cada ADM pode cadastrar sua própria chave PIX usando `/pix configurar`.")]
  }).catch(() => {});

  await status.send({
    embeds: [new EmbedBuilder().setColor(data.color).setAuthor({name:data.brandName,iconURL:avatar}).setTitle("🔔 Escala de Mediadores").setDescription("Use `/adm online` ou `/adm offline` para alterar seu status.")]
  }).catch(() => {});

  return data;
}
module.exports = { autoControl };
