const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, CategoryChannel, ChannelType, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder, AttachmentBuilder, UserSelectMenuBuilder } = require("discord.js");
const { db , owner , tk } = require("../../database/index");
const {panel, roleStaff, channelConfig, functionTicket, panelConfig} = require("../../function/panel");

module.exports = {
    name:"interactionCreate",
    run:async(interaction, client) => {
        const {customId, user, guild, channel, member} = interaction;
        if(!customId) return;
        const genProtocol = (length) => {
            let result = '';
            const charset = "1234567890";
            const charsetLength = charset.length;
          
            for (let i = 0; i < length; i++) {
              result += charset.charAt(Math.floor(Math.random() * charsetLength));
            }
          
            return result;
        };          
        if(interaction.isStringSelectMenu() && customId === "painel-ticket" || interaction.isButton() && await db.get(`panel.functions.${customId}`)) {
            const panel = await db.get("panel");
            const definition = await db.get("definition");
            let ids;
            if(interaction.isStringSelectMenu()) {
                ids = interaction.values[0];
            } else {
                ids = customId;
            }
            const functionTicket = panel.functions[ids];
            if(!functionTicket) return interaction.reply({content:`❌ **| Não encontrei este Painel. Contate com o Dono do ticket.**`, ephemeral: true });
            const channelTicket = interaction.guild.channels.cache.find(a => a.topic === `TICKET - ${interaction.user.id} | ${interaction.user.username}`);
            if(channelTicket) return interaction.reply({
                content:`❌ **| Você já tem um Ticket Criado!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channelTicket.url)
                        .setLabel("Ir ao Ticket")
                        .setEmoji("1218985928652099594")
                        .setStyle(5)
                    )
                ],
                ephemeral: true
            });
            if(!await db.get("system")) return interaction.reply({content:`❌ **| O Sistema de Ticket está desabilitado.**`, ephemeral: true });

            if(definition.functionsTicket.motivo) {
                const modal = new ModalBuilder()
                .setCustomId("ts" + ids)
                .setTitle("Motivo do Ticket");

                const text = new TextInputBuilder()
                .setCustomId("motivo")
                .setLabel("qual motivo para abrir o ticket?")
                .setStyle(1)
                .setRequired(true)
                .setPlaceholder("Digite o motivo...");

                modal.addComponents(new ActionRowBuilder().addComponents(text));

                return interaction.showModal(modal);
            }

            await interaction.reply({content:`🔁 **| Aguarde um momento... Estou criando o seu Ticket!**`, ephemeral: true });
            const parent = guild.channels.cache.get(definition.channels.category)?.id || channel.parent;
            const desc = functionTicket.desc === "Não Definido" ? `- Olá ${interaction.user}, Seja Bem-Vindo ao nosso sistema de atendimento. Aguarde um de nossos atendentes para lhe atender.` : functionTicket.desc;
            
            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: owner,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            ];
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push(
                {
                    id: role.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            );
            let msg = `${interaction.user} `;
            if(role) msg += `${role}`;

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("1215836101080776704"),
            );
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setEmoji("1247279087198928907"),
            );
            const {notifyuser, assumir, call, renomear, gerenciar, motivo} = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar)row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("1218973368540463114"),
            );
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(2)
                .setEmoji("1213993955193135144"),
            );

            const channel = await interaction.guild.channels.create({
                name:`📂・${interaction.user.username}`,
                topic: `TICKET - ${interaction.user.id} | ${interaction.user.username}`,
                permissionOverwrites,
                parent,
            });

            await channel.send({
                content:`${msg}`,
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({text:"Sistema de ticket, aguarde ser atendido.", iconURL: member.displayAvatarURL()})
                    .setTimestamp()
                    .addFields(
                        {
                            name:"📂 Motivo:",
                            value:`\`${ids}\``
                        }
                    )
                ],
                components: [row]
            });
            const protocolo = genProtocol(12);

            const logs = interaction.client.channels.cache.get(definition.channels.logs);
            if(logs) logs.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Logs System - #${protocolo}`)
                    .addFields(
                        {
                            name:"👤 Usuário que abriu:",
                            value:`${interaction.user} | \`${interaction.user.username}\``
                        }
                    )
                    .setColor("#00FFFF")
                    .setFooter({text:`Vá para o ticket pressionando o botão abaixo`})
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setLabel("Ticket Aberto")
                        .setStyle(5)
                        .setEmoji("1218985928652099594")
                    )
                ]
            });

            interaction.editReply({
                content:`✅ **| Seu ticket foi aberto com sucesso!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setLabel("Ticket Aberto")
                        .setStyle(5)
                        .setEmoji("1218985928652099594")
                    )
                ]
            });
            await tk.set(`${channel.id}`, {
                owner: {
                    username: user.username,
                    id: user.id
                },
                type: ids,
                assumido: null,
                protocolo,
                motivo: ids,
                data: formatDate(new Date())
            });
        }
        if(customId.startsWith("ts")) {
            const ids = customId.split("ts")[1];
            const panel = await db.get("panel");
            const definition = await db.get("definition");
            const functionTicket = panel.functions[ids];
            const motivo = interaction.fields.getTextInputValue("motivo");
            const channelTicket = interaction.guild.channels.cache.find(a => a.topic === `TICKET - ${interaction.user.id} | ${interaction.user.username}`);
            
            if(!functionTicket) return interaction.reply({content:`❌ **| Não encontrei este Painel. Contate com o Dono do ticket.**`, ephemeral: true });
            if(channelTicket) return interaction.reply({
                content:`❌ **| Você já tem um Ticket Criado!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channelTicket.url)
                        .setLabel("Ir ao Ticket")
                        .setEmoji("1218985928652099594")
                        .setStyle(5)
                    )
                ],
                ephemeral: true
            });
            
            if(!await db.get("system")) return interaction.reply({content:`❌ **| O Sistema de Ticket está desabilitado.**`, ephemeral: true });
            
            await interaction.reply({content:`🔁 **| Aguarde um momento... Estou criando o seu Ticket!**`, ephemeral: true });
            
            const parent = guild.channels.cache.get(definition.channels.category)?.id || channel.parent;
            const desc = functionTicket.desc === "Não Definido" ? `- Olá ${interaction.user}, Seja Bem-Vindo ao nosso sistema de atendimento. Aguarde um de nossos atendentes para lhe atender.` : functionTicket.desc;
            
            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: owner,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            ];
            
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push(
                {
                    id: role.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            );
            
            let msg = `${interaction.user} `;
            if(role) msg += `${role}`;

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("1215836101080776704"),
            );
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setEmoji("1247279087198928907"),
            );
            const {notifyuser, assumir, call, renomear, gerenciar} = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar)row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("1218973368540463114"),
            );
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(2)
                .setEmoji("1213993955193135144"),
            );

            const channel = await interaction.guild.channels.create({
                name:`📂・${interaction.user.username}`,
                topic: `TICKET - ${interaction.user.id} | ${interaction.user.username}`,
                permissionOverwrites,
                parent,
            });

            await channel.send({
                content:`${msg}`,
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({text:"Sistema de ticket, aguarde ser atendido.", iconURL: member.displayAvatarURL()})
                    .setTimestamp()
                    .addFields(
                        {
                            name:"📂 Motivo:",
                            value:`\`${motivo}\``
                        }
                    )
                ],
                components: [row]
            });
            const protocolo = genProtocol(12);

            const logs = interaction.client.channels.cache.get(definition.channels.logs);
            if(logs) logs.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Logs System - #${protocolo}`)
                    .addFields(
                        {
                            name:"👤 Usuário que abriu:",
                            value:`${interaction.user} | \`${interaction.user.username}\``
                        }
                    )
                    .setColor("#00FFFF")
                    .setFooter({text:`Vá para o ticket pressionando o botão abaixo`})
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setLabel("Ticket Aberto")
                        .setStyle(5)
                        .setEmoji("1218985928652099594")
                    )
                ]
            });

            interaction.editReply({
                content:`✅ **| Seu ticket foi aberto com sucesso!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setLabel("Ticket Aberto")
                        .setStyle(5)
                        .setEmoji("1218985928652099594")
                    )
                ]
            });
            await tk.set(`${channel.id}`, {
                owner: {
                    username: user.username,
                    id: user.id
                },
                type: ids,
                assumido: null,
                protocolo,
                motivo,
                data: formatDate(new Date())
            });
        }
        if(customId === "sair_ticket") {
            const ticket = await tk.get(channel.id);
            await interaction.deferUpdate();
            if(ticket.owner.id !== interaction.user.id) return;
            await channel.permissionOverwrites.edit(user.id,{
                ViewChannel: false,
                SendMessages: false,
            });
            const panel = await db.get("panel");
            const definition = await db.get("definition");

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji("1215836101080776704"),
            );
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji("1247279087198928907"),
            );
            const {notifyuser, assumir, call, renomear, gerenciar} = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar)row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("1218973368540463114"),
            );
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji("1213993955193135144"),
            );

            await interaction.editReply({
                components: [row]
            });

            channel.send({
                embeds: [
                    new EmbedBuilder()
                    .setColor("DarkPurple")
                    .setTitle("Ticket Finalizado")
                    .setDescription(`- O Ticket foi finalizado porque o usuário não estava mais presente.`)
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("deletar_ticket")
                        .setLabel("Deletar")
                        .setStyle(2)
                        .setEmoji("1213993955193135144"),
                    )
                ]
            });
        }
        if(customId == "deletar_ticket") {
            const ticket = await tk.get(channel.id);
            const panel = await db.get("panel");
            const definition = await db.get("definition");
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);

            await interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("deletar_ticket")
                        .setLabel("Deletar")
                        .setStyle(2)
                        .setDisabled(true)
                        .setEmoji("1213993955193135144"),
                    )
                ]
            });
            setTimeout(() => {
                channel.delete();
            }, 5000);
            const logs = interaction.client.channels.cache.get(definition.channels.logs);
            
            if(logs) logs.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Logs System - #${ticket.protocolo}`)
                    .setColor("#00FFFF")
                    .addFields(
                        {
                            name:"👤 Usuário que abriu:",
                            value:`<@${ticket.owner.id}> | \`${ticket.owner.username}\``
                        },
                        {
                            name:"🔧 Assumido por:",
                            value:`${ticket.assumido ? `<@${ticket.assumido}>` : "`Ninguem`"}`
                        },
                        {
                            name:"🔒 Fechado por:",
                            value:`${user} | \`${user.username}\``
                        },
                        {
                            name:"↕ Informações Adicionais:",
                            value:`- **Horários:**\n - Abertura: \`${ticket.data}\`\n - Fechamento: \`${formatDate(new Date())}\`\n- **Chamada:**\n - ${channels ? `${channels.url}` : "`Sem Chamada`"}\n- **Tipo:** \n - \`${ticket.type}\``
                        },
                    )
                    .setTimestamp()
                ],
            });

            const owner = interaction.client.users.cache.get(ticket.owner.id);
            if(owner) owner.send({
                content:`${owner}`,
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Ticket Fechado")
                    .setColor("#00FFFF")
                    .setDescription(`- Seu ticket foi fechado com sucesso, avalie nosso atendimento clicando nas estrelas abaixo.`)
                    .addFields(
                        {
                            name:"👤 Fechado por:",
                            value:`${user} | \`${user.username}\``,
                            inline: true
                        },
                        {
                            name:"📂 Protocolo:",
                            value:`${ticket.protocolo}`,
                            inline: true
                        },
                        {
                            name:"🔒 Fechado em:",
                            value:`\`${formatDate(new Date())}\``,
                            inline: true
                        }
                    )
                    .setFooter({text:`Caso necessário, não hesite em abrir ticket novamente!`})
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("stars_1")
                        .setLabel("1")
                        .setStyle(2)
                        .setEmoji("1247734376611975225"),
                        new ButtonBuilder()
                        .setCustomId("stars_2")
                        .setLabel("2")
                        .setStyle(2)
                        .setEmoji("1247734376611975225"),
                        new ButtonBuilder()
                        .setCustomId("stars_3")
                        .setLabel("3")
                        .setStyle(2)
                        .setEmoji("1247734376611975225"),
                        new ButtonBuilder()
                        .setCustomId("stars_4")
                        .setLabel("4")
                        .setStyle(2)
                        .setEmoji("1247734376611975225"),
                        new ButtonBuilder()
                        .setCustomId("stars_5")
                        .setStyle(2)
                        .setLabel("5")
                        .setEmoji("1247734376611975225"),
                    )
                ]
            }).then((msg) => {
                tk.set(`${msg.id}`, {
                    ...ticket
                });
            }).catch((err) => {console.log(err)});
        }
        if(customId.startsWith("stars_")) {
            const star = customId.split("stars_")[1];
            
            const modal = new ModalBuilder()
            .setCustomId(`starsmodal_${star}`)
            .setTitle("Avaliação de Atendimento");

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("dê uma breve avaliação.")
            .setStyle(1)
            .setPlaceholder("Digite aqui sua avaliação..")
            .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(text));

            return interaction.showModal(modal);
        }
        if(customId.startsWith("starsmodal_")) {
            const star = customId.split("starsmodal_")[1];
            const repeat = `⭐`.repeat(Number(star));
            await interaction.update({components:[]});
            const ticket = await tk.get(interaction.message.id);
            const definition = await db.get("definition");
            const feedback = interaction.client.channels.cache.get(definition.channels.feedback);
            if(feedback) await feedback.send({
                embeds: [
                    new EmbedBuilder()
                    .setColor("Random")
                    .setTitle(`${feedback.guild.name} - Avaliação Recebida`)
                    .addFields(
                        {
                            name:"👤 | Usuário",
                            value:`${user} | \`${user.username}\``
                        },
                        {
                            name:"⭐ | Avaliação",
                            value:`\`${repeat}\` (${star}/5)`
                        },
                        {
                            name:"🔧 | Atendido por",
                            value:`${ticket.assumido ? `<@${ticket.assumido}>` : "`Não Assumido`"}`
                        },
                        {
                            name:"✍ | Mensagem",
                            value: `\`${interaction.fields.getTextInputValue("text")}\``
                        },
                        {
                            name:"🕒 | Horário",
                            value:`\`${formatDate(new Date())}\``
                        }
                    )
                ]
            });
            
        }
        if(customId === "assumir_ticket") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const panel = await db.get("panel");
            const ids = ticket.type;
            const functionTicket = panel.functions[ids];

            const desc = functionTicket.desc === "Não Definido" ? `- Olá <@${ticket.owner.id}>, Seja Bem-Vindo ao nosso sistema de atendimento. Aguarde um de nossos atendentes para lhe atender.` : functionTicket.desc;

            if(!member.roles.cache.has(definition.role)) return interaction.deferUpdate();

            await tk.set(`${channel.id}.assumido`, interaction.user.id);
            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("1215836101080776704"),
            );
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setDisabled(true)
                .setStyle(2)
                .setEmoji("1247279087198928907"),
            );
            const {notifyuser, assumir, call, renomear, gerenciar} = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar)row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("1218973368540463114"),
            );
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(2)
                .setEmoji("1213993955193135144"),
            );
            interaction.update({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({text:"Sistema de ticket, aguarde ser atendido.", iconURL: member.displayAvatarURL()})
                    .setTimestamp()
                    .addFields(
                        {
                            name:"📂 Motivo:",
                            value:`\`${ticket.motivo}\``
                        },
                        {
                            name:"👷‍♂️ Assumido:",
                            value:`\`@${user.username} - (${user.id})\``
                        }
                    )
                ],
                components: [row]
            });
            
            const logs = interaction.client.channels.cache.get(definition.channels.logs);
            if(logs) logs.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Logs System - #${ticket.protocolo}`)
                    .addFields(
                        {
                            name:"👤 Usuário que Assumiu:",
                            value:`${interaction.user} | \`${interaction.user.username}\``
                        }
                    )
                    .setColor("#00FFFF")
                    .setFooter({text:`Vá para o ticket pressionando o botão abaixo`})
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setLabel("Ticket Aberto")
                        .setStyle(5)
                        .setEmoji("1218985928652099594")
                    )
                ]
            });
        }
        if(customId == "painel_staff") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const panel = await db.get("panel");
            const {notifyuser, assumir, call, renomear, gerenciar} = definition.functionsTicket;
            if(!member.roles.cache.has(definition.role)) return interaction.deferUpdate();
            
            const select = new StringSelectMenuBuilder()
            .setCustomId("panelstaff")
            .setPlaceholder("🔧 Selecione a opção desejada.")
            .setMaxValues(1)
            .setMinValues(1);

            if(notifyuser) select.addOptions(
                {
                    label:"Notificar Usuário",
                    description:"Notificar o usuário que abriu ticket.",
                    emoji:"1247713435450609675",
                    value:"notify"
                }
            );

            if(gerenciar) {
                select.addOptions(
                    {
                        label:"Adicionar Membro",
                        value:"addmember",
                        description:"Adicionar um membro ao ticket",
                        emoji:"1218977376172507227"
                    }
                );
                select.addOptions(
                    {
                        label:"Remover Membro",
                        value:"removemember",
                        description:"Remover um membro ao ticket",
                        emoji:"1218977445944758354"
                    }
                );
            }

            if(renomear) select.addOptions(
                {
                    label:"Renomear Ticket.",
                    description:"Renomear o Ticket.",
                    emoji:"✏",
                    value:"rename"
                }
            );

            if(call) select.addOptions(
                {
                    label:"Painel de Chamada",
                    description:"Abrir o painel de chamada.",
                    value:"panel_chamada",
                    emoji:"📞"
                }
            );

            interaction.reply({
                content:`Olá ${interaction.user}, Selecione a opção deseja.`,
                components: [new ActionRowBuilder().addComponents(select)],
                ephemeral: true
            });
        }
        if(customId === "panelstaff") {
            const options = interaction.values[0];
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const panel = await db.get("panel");
            const ownerUser = interaction.client.users.cache.get(ticket.owner.id);

            if(options == "notify") {
                if(!ownerUser) return interaction.update({
                    content:`❌ **| Usuário não encontrado.**`,
                    components: []
                });
                ownerUser.send({
                    embeds: [
                        new EmbedBuilder()
                        .setDescription(`*Olá **${ownerUser}**, tem um staff está lhe chamando em um ticket.*`)
                        .setColor("#00FFFF")
                    ],
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setURL(channel.url)
                            .setLabel("Ir ao Ticket")
                            .setStyle(5)
                            .setEmoji("1218985928652099594")
                        )
                    ]
                }).then(() => {
                    interaction.update({
                        content:`✅ **| Usuário notificado com sucesso!**`,
                        components: []
                    });
                }).catch(() => {
                    interaction.update({
                        content:`❌ **| Usuário está com o privado bloqueado!`,
                        components: []
                    });
                });
            } else if(options === "addmember") {
                interaction.update({
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                            .setCustomId("addmemberselect")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Selecione um usuário abaixo.")
                        )
                    ]
                });
            } else if(options == "removemember") {
                interaction.update({
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                            .setCustomId("removememberselect")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Selecione um usuário abaixo.")
                        )
                    ]
                });
            } else if(options === "rename") {
                const modal = new ModalBuilder()
                .setCustomId("renamemodal")
                .setTitle("Renomear o Ticket");

                const text = new TextInputBuilder()
                .setCustomId("text")
                .setLabel("coloque o novo nome:")
                .setStyle(1)
                .setRequired(true)
                .setMaxLength(60)
                .setPlaceholder("Produto já entregue.");

                modal.addComponents(new ActionRowBuilder().addComponents(text));

                return interaction.showModal(modal);
            } else if(options === "panel_chamada") {
                await interaction.deferUpdate();
                panelChamada();
            }
        }
        if(customId === "renamemodal") {
            const name = interaction.fields.getTextInputValue("text");
            await channel.setName(name);
            interaction.update({content:`Nome alterado para: \`${name}\``, ephemeral: true, components: [] });
        }
        if(customId === "removememberselect") {
            await interaction.channel.permissionOverwrites.edit(interaction.values[0],{
                ViewChannel: false,
                SendMessages: false,
            });
            await interaction.update({
                content:`Usuário removido com sucesso.`,
                components:[]
            });
        }
        if(customId === "addmemberselect") {
            await interaction.channel.permissionOverwrites.edit(interaction.values[0],{
                ViewChannel: true,
                SendMessages: true,
            });
            await interaction.update({
                content:`Usuário adicionado com sucesso.`,
                components:[]
            });
        }
        if(customId === "criarcall") {
            await interaction.deferUpdate();

            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const panel = await db.get("panel");

            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect"]
                },
                {
                    id: ticket.owner.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles", "Connect"]
                },
            ];
            
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push(
                {
                    id: role.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            );
            await interaction.guild.channels.create({
                name:`📞・${ticket.owner.username}`,
                permissionOverwrites,
                parent: interaction.channel.parent,
                type: ChannelType.GuildVoice
            });
            panelChamada();
        }
        if(customId === "apagarcall") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) await channels.delete().catch(() => {});
            panelChamada();
        }
        if(customId === "addusercall") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                        .setCustomId("addusercallselect")
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder("Escolha o usuário")
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("newvolt")
                        .setEmoji("1215836101080776704")
                        .setStyle(2)
                    )
                ]
            });
        }
        if(customId === "removeusercall") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                        .setCustomId("removeusercallselect")
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder("Escolha o usuário")
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("newvolt")
                        .setEmoji("1215836101080776704")
                        .setStyle(2)
                    )
                ]
            });
        }
        if(customId === "addusercallselect") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) channels.permissionOverwrites.edit(interaction.values[0],{
                ViewChannel: true,
                SendMessages: true,
                Connect: true
            });
            panelChamada();
        }
        if(customId === "removeusercallselect") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) channels.permissionOverwrites.edit(interaction.values[0],{
                ViewChannel: false,
                SendMessages: false,
                Connect: false
            });
            panelChamada();
        }
        if(customId == "newvolt") {
            await interaction.deferUpdate();
            panelChamada();
        }
        async function panelChamada() {
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            const row = new ActionRowBuilder();
            
            if(!channels) {
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("criarcall")
                    .setLabel("Criar Call")
                    .setStyle(1)
                    .setEmoji("1218977376172507227")
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("apagarcall")
                    .setLabel("Apagar Call")
                    .setStyle(4)
                    .setEmoji("1214001564424085574")
                    .setDisabled(true)
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("addusercall")
                    .setLabel("Adicionar Usuário")
                    .setStyle(2)
                    .setDisabled(true)
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("removeusercall")
                    .setLabel("Remover Usuário")
                    .setStyle(2)
                    .setDisabled(true)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                    .setURL(channels.url)
                    .setLabel("Ir para Call")
                    .setStyle(5)
                    .setEmoji("1218985928652099594")
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("apagarcall")
                    .setLabel("Apagar Call")
                    .setStyle(4)
                    .setEmoji("1214001564424085574")
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("addusercall")
                    .setLabel("Adicionar Usuário")
                    .setStyle(2)
                );
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("removeusercall")
                    .setLabel("Remover Usuário")
                    .setStyle(2)
                );
            }

            interaction.editReply({
                content:"",
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Painel de Chamada")
                    .setColor("DarkPurple")
                    .setDescription(`- Olá ${interaction.user}, Selecione a opção desejada abaixo.`)
                    .addFields(
                        {
                            name:"Chamada",
                            value:`${channels ? "`🟢 Em andamento`" : "`🔴 Não iniciado`"}`
                        }
                    )
                ],
                components: [row]
            });
        }
    }}

    function formatDate (date) {
        
        const brtOffset = -3; 
        
        
        const utcOffset = date.getTimezoneOffset(); // Em minutos
        
        
        const brtDate = new Date(date.getTime() + (utcOffset * 60000) + (brtOffset * 3600000));
      
        const day = String(brtDate.getDate()).padStart(2, '0');
        const month = String(brtDate.getMonth() + 1).padStart(2, '0'); 
        const year = brtDate.getFullYear();
        const hours = String(brtDate.getHours()).padStart(2, '0');
        const minutes = String(brtDate.getMinutes()).padStart(2, '0');
        const seconds = String(brtDate.getSeconds()).padStart(2, '0');
      
        return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    };