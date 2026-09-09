require("dotenv").config();
const {
  Client, GatewayIntentBits, Partials, Events, PermissionFlagsBits,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType
} = require("discord.js");
const QRCode = require("qrcode");
const { load, save } = require("./storage");
const { autoControl } = require("./setup");
const { queueEmbed, queueButtons, joinQueue, leaveQueue } = require("./queues");
const { pixPayload } = require("./pix");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

const data = () => load();
const isAdmin = i => i.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
  (data().adminRoleId && i.member?.roles?.cache?.has(data().adminRoleId));

function baseEmbed(title, description) {
  const d = data();
  return new EmbedBuilder().setColor(d.color).setAuthor({
    name: d.brandName,
    iconURL: client.user?.displayAvatarURL()
  }).setTitle(title).setDescription(description);
}

client.once(Events.ClientReady, async c => {
  console.log(`✅ ${c.user.tag} online.`);
  c.user.setActivity("filas • Duck ORG", { type: 0 });
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith("queue_join:"))
        return joinQueue(interaction, interaction.customId.split(":")[1]);
      if (interaction.customId.startsWith("queue_leave:"))
        return leaveQueue(interaction, interaction.customId.split(":")[1]);

      if (interaction.customId === "ticket_open") {
        const d = data();
        const parent = d.categories.tickets ? interaction.guild.channels.cache.get(d.categories.tickets) : null;
        const name = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
        const ch = await interaction.guild.channels.create({
          name, type: ChannelType.GuildText, parent: parent?.id,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: ["ViewChannel"] },
            { id: interaction.user.id, allow: ["ViewChannel","SendMessages","ReadMessageHistory"] },
            ...(d.adminRoleId ? [{ id: d.adminRoleId, allow: ["ViewChannel","SendMessages","ReadMessageHistory"] }] : [])
          ]
        });
        await ch.send({ embeds: [baseEmbed("🎟️ Ticket aberto", `Olá <@${interaction.user.id}>! Um membro da equipe irá atender você.`)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("ticket_close").setLabel("Fechar Ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger)
          )] });
        return interaction.reply({ content: `🎟️ Ticket criado: ${ch}`, ephemeral: true });
      }
      if (interaction.customId === "ticket_close") {
        if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode fechar este ticket.",ephemeral:true});
        await interaction.reply("🔒 Ticket será fechado em 3 segundos.");
        setTimeout(() => interaction.channel.delete().catch(()=>{}), 3000);
      }
    }

    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction.commandName;

    if (cmd === "auto-controle") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode usar este comando.",ephemeral:true});
      const sub = interaction.options.getSubcommand();
      if (sub === "configurar" || sub === "corrigir") {
        await autoControl(interaction.guild, client);
        return interaction.reply({content:"✅ Auto-Controle concluído. A estrutura foi criada/verificada e organizada.",ephemeral:true});
      }
      if (sub === "verificar") {
        const d = data();
        const ok = d.categories.filas && d.channels.filas && d.channels.tickets && d.channels.pix && d.channels.status;
        return interaction.reply({content: ok ? "✅ A estrutura principal está configurada." : "⚠️ Há itens faltando. Use `/auto-controle corrigir`.",ephemeral:true});
      }
    }

    if (cmd === "fila") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode gerenciar filas.",ephemeral:true});
      const sub = interaction.options.getSubcommand();
      if (sub === "criar") {
        const d = data();
        const q = {
          id: Date.now().toString(36),
          format: interaction.options.getString("formato"),
          type: interaction.options.getString("tipo"),
          mode: interaction.options.getString("modo"),
          price: interaction.options.getNumber("valor"),
          maxPlayers: interaction.options.getInteger("jogadores"),
          emoji: interaction.options.getString("emoji") || "♦️",
          color: interaction.options.getString("cor") || "#ED1C24",
          players: []
        };
        const channel = interaction.guild.channels.cache.get(d.channels.filas) || interaction.channel;
        const msg = await channel.send({embeds:[queueEmbed(client,q)],components:[queueButtons(q.id)]});
        q.channelId = channel.id; q.messageId = msg.id;
        d.queues.push(q); save(d);
        return interaction.reply({content:`✅ Fila criada em ${channel}.`,ephemeral:true});
      }
      if (sub === "listar") {
        const d = data();
        return interaction.reply({embeds:[baseEmbed("🎮 Filas", d.queues.length ? d.queues.map(q=>`**${q.format} ${q.mode}** • ${q.price} • ${q.players.length}/${q.maxPlayers}`).join("\\n") : "Nenhuma fila criada.")],ephemeral:true});
      }
      if (sub === "limpar") {
        const d = data();
        d.queues = []; save(d);
        return interaction.reply({content:"🧹 Filas registradas no banco de dados foram limpas. As mensagens antigas precisam ser removidas manualmente.",ephemeral:true});
      }
    }

    if (cmd === "adm") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode usar este comando.",ephemeral:true});
      const sub = interaction.options.getSubcommand();
      if (!client.admStatus) client.admStatus = new Map();
      if (sub === "online") { client.admStatus.set(interaction.user.id,true); return interaction.reply({content:"🟢 Você está ONLINE como mediador.",ephemeral:true}); }
      if (sub === "offline") { client.admStatus.set(interaction.user.id,false); return interaction.reply({content:"🔴 Você está OFFLINE como mediador.",ephemeral:true}); }
      if (sub === "lista") {
        const online=[...client.admStatus.entries()].filter(x=>x[1]).map(x=>`🟢 <@${x[0]}>`);
        const offline=[...client.admStatus.entries()].filter(x=>!x[1]).map(x=>`❌ <@${x[0]}>`);
        return interaction.reply({embeds:[baseEmbed("🔔 Escala de Mediadores",`**Online agora:**\\n${online.join("\\n")||"Nenhum mediador online."}\\n\\n**Offline:**\\n${offline.join("\\n")||"Nenhum registrado."}`)],ephemeral:true});
      }
    }

    if (cmd === "pix") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode gerenciar PIX.",ephemeral:true});
      const sub=interaction.options.getSubcommand();
      const d=data(); d.pix=d.pix||{};
      if (sub==="configurar") {
        const key=interaction.options.getString("chave",true);
        const nome=interaction.options.getString("nome")||"Duck ORG";
        const cidade=interaction.options.getString("cidade")||"SAO PAULO";
        d.pix[interaction.user.id]={key,nome,cidade}; save(d);
        return interaction.reply({content:"✅ Chave PIX cadastrada para o seu usuário.",ephemeral:true});
      }
      if (sub==="status") {
        const p=d.pix?.[interaction.user.id];
        return interaction.reply({content:p?`✅ Chave cadastrada: \`${p.key}\``:"⚠️ Você ainda não cadastrou uma chave PIX.",ephemeral:true});
      }
      if (sub==="qr") {
        const p=d.pix?.[interaction.user.id];
        if(!p) return interaction.reply({content:"Cadastre a chave primeiro com `/pix configurar`.",ephemeral:true});
        const payload=pixPayload({key:p.key,name:p.nome,city:p.cidade});
        const buf=await QRCode.toBuffer(payload);
        return interaction.reply({content:"📲 QR Code PIX gerado. Este QR é para chave PIX estática.",files:[{attachment:buf,name:"pix.png"}],ephemeral:true});
      }
      if (sub==="resetar") {
        delete d.pix[interaction.user.id]; save(d);
        return interaction.reply({content:"🗑️ Seus dados PIX foram removidos.",ephemeral:true});
      }
    }

    if (cmd === "ticket") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode gerenciar o painel.",ephemeral:true});
      if (interaction.options.getSubcommand()==="painel") {
        const d=data(); const ch=interaction.guild.channels.cache.get(d.channels.tickets)||interaction.channel;
        await ch.send({embeds:[baseEmbed("🎟️ Atendimento","Clique no botão abaixo para abrir um ticket.")],
          components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket_open").setLabel("Abrir Ticket").setEmoji("🎟️").setStyle(ButtonStyle.Primary))]});
        return interaction.reply({content:`✅ Painel enviado em ${ch}.`,ephemeral:true});
      }
    }

    if (cmd === "sorteio") {
      if (!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode criar sorteios.",ephemeral:true});
      const sub=interaction.options.getSubcommand();
      if(sub==="criar"){
        const premio=interaction.options.getString("premio",true);
        const minutos=interaction.options.getInteger("minutos",true);
        const vencedores=interaction.options.getInteger("vencedores",true);
        const end=Date.now()+minutos*60000;
        const msg=await interaction.channel.send({embeds:[baseEmbed("🎉 SORTEIO",`**Prêmio:** ${premio}\\n**Vencedores:** ${vencedores}\\n**Termina:** <t:${Math.floor(end/1000)}:R>\\n\\nClique em 🎉 para participar.`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway:${Date.now()}`).setLabel("Participar").setEmoji("🎉").setStyle(ButtonStyle.Success))]});
        await msg.react("🎉").catch(()=>{});
        return interaction.reply({content:"✅ Sorteio criado.",ephemeral:true});
      }
      if(sub==="encerrar") return interaction.reply({content:"Use a reação 🎉 da mensagem do sorteio e selecione o vencedor manualmente nesta primeira versão.",ephemeral:true});
    }

    if (cmd === "perfil") {
      return interaction.reply({embeds:[baseEmbed("👤 Perfil",`**Usuário:** ${interaction.user}\\n**ID:** \`${interaction.user.id}\``)],ephemeral:true});
    }

    if (cmd === "painel") {
      if(!isAdmin(interaction)) return interaction.reply({content:"Apenas ADM pode abrir o painel.",ephemeral:true});
      return interaction.reply({embeds:[baseEmbed("🛠️ Painel Administrativo","`/auto-controle` • organizar\\n`/fila criar` • criar fila\\n`/adm online` • entrar na escala\\n`/pix configurar` • cadastrar PIX\\n`/ticket painel` • painel de tickets\\n`/sorteio criar` • criar sorteio")],ephemeral:true});
    }

  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) interaction.followUp({content:"❌ Ocorreu um erro. Veja o console do bot.",ephemeral:true}).catch(()=>{});
    else interaction.reply({content:"❌ Ocorreu um erro. Veja o console do bot.",ephemeral:true}).catch(()=>{});
  }
});

client.login(process.env.DISCORD_TOKEN);
