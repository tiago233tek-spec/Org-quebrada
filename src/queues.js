const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder
} = require("discord.js");
const { load, save } = require("./storage");

function money(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function queueEmbed(bot, q) {
  const users = q.players.length
    ? q.players.map((id, i) => `↳ <@${id}>`).join("\\n")
    : "↳ Nenhum jogador na fila.";

  return new EmbedBuilder()
    .setColor(q.color || "#ED1C24")
    .setAuthor({ name: bot.user.username, iconURL: bot.user.displayAvatarURL() })
    .setTitle(`${q.emoji || "♦️"} ${q.format} | Fila de Competição`)
    .addFields(
      { name: "👑 Formato", value: q.type, inline: false },
      { name: "👑 Valor", value: money(q.price), inline: false },
      { name: "🎮 Jogadores", value: users, inline: false }
    )
    .setFooter({ text: `${q.mode.toUpperCase()} • Duck ORG` });
}

function queueButtons(qid) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`queue_join:${qid}`).setLabel("Entrar").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`queue_leave:${qid}`).setLabel("Sair da Fila").setEmoji("❌").setStyle(ButtonStyle.Danger)
  );
}

async function refreshQueueMessage(bot, q) {
  if (!q.channelId || !q.messageId) return;
  try {
    const ch = await bot.channels.fetch(q.channelId);
    const msg = await ch.messages.fetch(q.messageId);
    await msg.edit({ embeds: [queueEmbed(bot, q)], components: [queueButtons(q.id)] });
  } catch {}
}

async function joinQueue(interaction, qid) {
  const data = load();
  const q = data.queues.find(x => x.id === qid);
  if (!q) return interaction.reply({ content: "Fila não encontrada.", ephemeral: true });
  if (q.players.includes(interaction.user.id))
    return interaction.reply({ content: "Você já está nessa fila.", ephemeral: true });
  if (q.players.length >= q.maxPlayers)
    return interaction.reply({ content: "Essa fila está cheia.", ephemeral: true });

  q.players.push(interaction.user.id);
  save(data);
  await interaction.reply({ content: `✅ Você entrou na fila **${q.format} ${q.mode}**.`, ephemeral: true });

  if (q.players.length >= q.maxPlayers) {
    const ch = interaction.channel;
    await ch.send(`🎮 **Fila completa!** ${q.players.map(id => `<@${id}>`).join(" ")}\nUm mediador/ADM deve assumir o atendimento.`);
  }
}
async function leaveQueue(interaction, qid) {
  const data = load();
  const q = data.queues.find(x => x.id === qid);
  if (!q) return interaction.reply({ content: "Fila não encontrada.", ephemeral: true });
  const before = q.players.length;
  q.players = q.players.filter(id => id !== interaction.user.id);
  save(data);
  return interaction.reply({
    content: before === q.players.length ? "Você não estava nessa fila." : "❌ Você saiu da fila.",
    ephemeral: true
  });
}
module.exports = { queueEmbed, queueButtons, refreshQueueMessage, joinQueue, leaveQueue };
