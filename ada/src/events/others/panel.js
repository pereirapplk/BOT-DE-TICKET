const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, CategoryChannel, ChannelType, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");
const { db , owner , tk } = require("../../database/index");
const {panel, roleStaff, channelConfig, functionTicket, panelConfig} = require("../../function/panel");

module.exports = {
    name:"interactionCreate",
    run:async(interaction, client) => {
        const {customId, user, guild, channel, member} = interaction;
        if(!customId) return;
        if(customId === "systemtrueorfalse") {
            await interaction.deferUpdate()
            const systemt = await db.get("system");
            await db.set(`system`, !systemt);
            panel(interaction);
        }
        if(customId === "definition") {
            interaction.update({
                content:`O que precisa configurar?`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("functionsTicket")
                        .setLabel("Funções de Ticket")
                        .setStyle(1)
                        .setEmoji("1218985928652099594"),
                        new ButtonBuilder()
                        .setCustomId("channelsconfig")
                        .setLabel("Canais")
                        .setStyle(2)
                        .setEmoji("🏳️"),
                        new ButtonBuilder()
                        .setLabel("Cargos")
                        .setCustomId("rolesconfig")
                        .setStyle(2)
                        .setEmoji("1247209950804181102"),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("voltar")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }
        if(customId === "functionsTicket") {
            await interaction.deferUpdate();
            functionTicket(interaction);
        }
        if(customId === "functionSelectcConfig") {
            const option = interaction.values[0];
            if(option === "voltarpanel") return interaction.update({
                content:`O que precisa configurar?`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("functionsTicket")
                        .setLabel("Funções de Ticket")
                        .setStyle(1)
                        .setEmoji("1218985928652099594"),
                        new ButtonBuilder()
                        .setCustomId("channelsconfig")
                        .setLabel("Canais")
                        .setStyle(2)
                        .setEmoji("🏳️"),
                        new ButtonBuilder()
                        .setLabel("Cargos")
                        .setCustomId("rolesconfig")
                        .setStyle(2)
                        .setEmoji("1247209950804181102"),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("voltar")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
            await interaction.deferUpdate();
            await db.set(`definition.functionsTicket.${option}`, !await db.get(`definition.functionsTicket.${option}`));
            functionTicket(interaction);
        }
        if(customId === "voltar") {
            await interaction.deferUpdate();
            panel(interaction);
        }
        if(customId === "rolesconfig") {
            await interaction.deferUpdate();
            roleStaff(interaction);
        }
        if(customId === "configrolekk") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                        .setCustomId("selectconfigroles")
                        .setPlaceholder("Selecione o cargo de ADM.")
                        .setMaxValues(1)
                        .setMinValues(1)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("rolesconfig")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }
        if(customId === "selectconfigroles") {
            await interaction.deferUpdate();
            await db.set(`definition.role`, interaction.values[0]);
            roleStaff(interaction);
        }
        if(customId === "channelsconfig") {
            await interaction.deferUpdate();
            channelConfig(interaction);
        }
        if(customId.startsWith("configchannel")) {
            const id = customId.split("configchannel")[1];

            const select = new ChannelSelectMenuBuilder()
            .setCustomId(`selectconfigchannel${id}`)
            .setChannelTypes(id === "category" ? ChannelType.GuildCategory : ChannelType.GuildText)
            .setMaxValues(1)
            .setPlaceholder("Escolha o Canal que será atribuido.");


            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("channelsconfig")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }
        if(customId.startsWith("selectconfigchannel")) {
            const id = customId.split("selectconfigchannel")[1];
            await interaction.deferUpdate();
            await db.set(`definition.channels.${id}`, interaction.values[0]);
            channelConfig(interaction);
        }

        if(customId === "configpanel") {
            await interaction.deferUpdate();
            panelConfig(interaction);
        }

        if(customId === "trocarembedcontent") {
            await interaction.deferUpdate();
            await db.set("panel.mensagem.content", !await db.get("panel.mensagem.content"));
            panelConfig(interaction);
        }
        if(customId === "alterarbotaoselect") {
            await interaction.deferUpdate();
            await db.set("panel.button", !await db.get("panel.button"));
            panelConfig(interaction);
        }

        if(customId === "resetartudofunction") {
            const modal = new ModalBuilder()
            .setCustomId("resetartudofunctionmodal")
            .setTitle("Resetar Tudo");

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Você tem certeza?")
            .setStyle(1)
            .setMaxLength(3)
            .setRequired(true)
            .setMinLength(3)
            .setPlaceholder("sim");

            modal.addComponents(new ActionRowBuilder().addComponents(text));

            return interaction.showModal(modal);
        }

        if(customId === "resetartudofunctionmodal") {
            const text = interaction.fields.getTextInputValue("text").toLowerCase();
            await interaction.deferUpdate();
            if(text !== "sim") return;

            await db.set("panel", {
                "mensagem": {
                    "content": false,
                    "embeds": {
                        "title": "Não Definido",
                        "desc": "Não Definido",
                        "banner": null,
                        "cor": "#00FFFF"
                    },
                    "msg": {
                        "content": "Não Definido",
                        "banner": null
                    }
                },
                "functions": {},
                "button": false,
                "messages": []
            });
            panelConfig(interaction);
        }
        
        if(customId === "addfunction") {
            const modal = new ModalBuilder()
            .setCustomId("addfunctionmodal")
            .setTitle("Adicionar Função");

            const nome = new TextInputBuilder()
            .setCustomId("nome")
            .setStyle(1)
            .setLabel("nome da função")
            .setRequired(true)
            .setMaxLength(40)
            .setPlaceholder("insira aqui o nome, como Suporte");

            const predesc = new TextInputBuilder()
            .setCustomId("predesc")
            .setLabel("pré descrição")
            .setStyle(1)
            .setRequired(true)
            .setMaxLength(60)
            .setPlaceholder("insira aqui uma pré descrição");

            const desc = new TextInputBuilder()
            .setCustomId("desc")
            .setLabel("descrição")
            .setRequired(false)
            .setMaxLength(4000)
            .setStyle(2)
            .setPlaceholder("insira aqui uma descrição");

            const banner = new TextInputBuilder()
            .setCustomId("banner")
            .setLabel("banner (opcional)")
            .setRequired(false)
            .setPlaceholder("insira aqui uma URL da imagem ou GIF")
            .setStyle(1);

            const emoji = new TextInputBuilder()
            .setCustomId("emoji")
            .setLabel("emoji da função (opcional)")
            .setStyle(1)
            .setPlaceholder("Insira aqui um emoji")
            .setRequired(false);

            modal.addComponents(new ActionRowBuilder().addComponents(nome));
            modal.addComponents(new ActionRowBuilder().addComponents(predesc));
            modal.addComponents(new ActionRowBuilder().addComponents(desc));
            modal.addComponents(new ActionRowBuilder().addComponents(banner));
            modal.addComponents(new ActionRowBuilder().addComponents(emoji));

            return interaction.showModal(modal);
        }

        if(customId === "addfunctionmodal") {
            const nome = interaction.fields.getTextInputValue("nome");
            const predesc = interaction.fields.getTextInputValue("predesc");
            const desc = interaction.fields.getTextInputValue("desc") || "Não Definido";
            const banner = interaction.fields.getTextInputValue("banner") || null;
            const emoji = interaction.fields.getTextInputValue("emoji") || null;
            await interaction.deferUpdate();
            if(await db.get(`panel.functions.${nome}`)) return;
            await db.set(`panel.functions.${nome}`, {
                "predesc": predesc,
                "desc": desc,
                "banner": banner,
                "emoji": emoji
            });
            panelConfig(interaction);
        }
        if(customId === "editfunction") {
            const panel = await db.get("panel");
            const all = Object.entries(panel.functions);
            const select = new StringSelectMenuBuilder()
            .setCustomId("editfunctionrsrs")
            .setPlaceholder("Selecione uma função para editar")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((a) => {
                const id = a["0"];
                const data = a["1"];
                select.addOptions(
                    {
                        label: `${id}`,
                        description:`${data.predesc}`,
                        value: id
                    }
                );
            });
            interaction.update({
                embeds: [],
                content:`${interaction.user}, Qual função deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }
        if(customId === "removefunction") {
            const panel = await db.get("panel");
            const all = Object.entries(panel.functions);
            const select = new StringSelectMenuBuilder()
            .setCustomId("removefunctionrsrs")
            .setPlaceholder("Selecione uma função para remover")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((a) => {
                const id = a["0"];
                const data = a["1"];
                select.addOptions(
                    {
                        label: `${id}`,
                        description:`${data.predesc}`,
                        value: id
                    }
                );
            });
            interaction.update({
                embeds: [],
                content:`${interaction.user}, Qual função deseja remover?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }

        if(customId == "removefunctionrsrs") {
            const id = interaction.values[0];
            await interaction.deferUpdate();
            await db.delete(`panel.functions.${id}`);
            panelConfig(interaction);
        }

        if(customId === "editfunctionrsrs") {
            const id = interaction.values[0];
            const data = await db.get(`panel.functions.${id}`);
            const modal = new ModalBuilder()
            .setCustomId("editfunctionrsrsmodal" + `${id}`)
            .setTitle("Adicionar Função");

            const nome = new TextInputBuilder()
            .setCustomId("nome")
            .setStyle(1)
            .setLabel("nome da função")
            .setRequired(true)
            .setValue(id)
            .setMaxLength(40)
            .setPlaceholder("insira aqui o nome, como Suporte");

            const predesc = new TextInputBuilder()
            .setCustomId("predesc")
            .setLabel("pré descrição")
            .setStyle(1)
            .setRequired(true)
            .setValue(data.predesc)
            .setMaxLength(60)
            .setPlaceholder("insira aqui uma pré descrição");

            const desc = new TextInputBuilder()
            .setCustomId("desc")
            .setLabel("descrição")
            .setRequired(false)
            .setMaxLength(4000)
            .setStyle(2)
            .setPlaceholder("insira aqui uma descrição");
            if(data.desc !== "Não Definido") desc.setValue(data.desc);

            const banner = new TextInputBuilder()
            .setCustomId("banner")
            .setLabel("banner (opcional)")
            .setRequired(false)
            .setPlaceholder("insira aqui uma URL da imagem ou GIF")
            .setStyle(1);
            if(data.banner) banner.setValue(data.banner);

            const emoji = new TextInputBuilder()
            .setCustomId("emoji")
            .setLabel("emoji da função (opcional)")
            .setStyle(1)
            .setPlaceholder("Insira aqui um emoji")
            .setRequired(false);
            if(data.emoji) emoji.setValue(data.emoji);

            modal.addComponents(new ActionRowBuilder().addComponents(nome));
            modal.addComponents(new ActionRowBuilder().addComponents(predesc));
            modal.addComponents(new ActionRowBuilder().addComponents(desc));
            modal.addComponents(new ActionRowBuilder().addComponents(banner));
            modal.addComponents(new ActionRowBuilder().addComponents(emoji));

            return interaction.showModal(modal);
        }
        if(customId.startsWith("editfunctionrsrsmodal")) {
            const id = customId.split("editfunctionrsrsmodal")[1];
            const nome = interaction.fields.getTextInputValue("nome");
            const predesc = interaction.fields.getTextInputValue("predesc");
            const desc = interaction.fields.getTextInputValue("desc") || "Não Definido";
            const banner = interaction.fields.getTextInputValue("banner") || null;
            const emoji = interaction.fields.getTextInputValue("emoji") || null;
            await interaction.deferUpdate();
            await db.delete(`panel.functions.${id}`);
            await db.set(`panel.functions.${nome}`, {
                "predesc": predesc,
                "desc": desc,
                "banner": banner,
                "emoji": emoji
            });
            panelConfig(interaction);
        }
        
        if(customId === "definitraparenciafunction") {
            const modal = new ModalBuilder()
            .setCustomId("definitraparenciafunctionmodal")
            .setTitle("Editar Ticket");
            const panel = await db.get("panel");

            if(panel.mensagem.content) {
                const content = new TextInputBuilder()
                .setCustomId("content")
                .setLabel("Mensagem")
                .setPlaceholder("insira aqui a mensagem do painel")
                .setMaxLength(2000)
                .setStyle(2)
                .setRequired(true);

                const banner = new TextInputBuilder()
                .setCustomId("banner")
                .setLabel("banner (opcional)")
                .setRequired(false)
                .setPlaceholder("insira aqui uma URL de imagem ou GIF")
                .setStyle(1);

                modal.addComponents(new ActionRowBuilder().addComponents(content));
                modal.addComponents(new ActionRowBuilder().addComponents(banner));
                return interaction.showModal(modal);
            } else {
                const title = new TextInputBuilder()
                .setCustomId("title")
                .setLabel("titulo")
                .setRequired(true)
                .setMaxLength(200)
                .setStyle(1)
                .setPlaceholder("insira aqui um nome, como: Entrar em contato");
    
                const desc = new TextInputBuilder()
                .setCustomId("desc")
                .setLabel("descrição")
                .setPlaceholder("Insira aqui uma descrição")
                .setStyle(2)
                .setRequired(true)
                .setMaxLength(4000);
    
                const banner = new TextInputBuilder()
                .setCustomId("banner")
                .setLabel("banner (opcional)")
                .setRequired(false)
                .setPlaceholder("insira aqui uma URL de imagem ou GIF")
                .setStyle(1);
    
                const cor = new TextInputBuilder()
                .setCustomId("cor")
                .setLabel("cor da embed (opcional)")
                .setRequired(false)
                .setPlaceholder("insira aqui um codigo Hex Color, Ex: #00FFFF")
                .setStyle(1);
    
                modal.addComponents(new ActionRowBuilder().addComponents(title));
                modal.addComponents(new ActionRowBuilder().addComponents(desc));
                modal.addComponents(new ActionRowBuilder().addComponents(banner));
                modal.addComponents(new ActionRowBuilder().addComponents(cor));
    
                return interaction.showModal(modal);
            }
        }

        if(customId === "definitraparenciafunctionmodal") {
            const panel = await db.get("panel");
            
            if(panel.mensagem.content) {
                const content = interaction.fields.getTextInputValue("content");
                const banner = interaction.fields.getTextInputValue("banner") || null;
    
                await interaction.deferUpdate();
    
                await db.set("panel.mensagem.msg", {
                    content,
                    banner
                });
    
                panelConfig(interaction);
            } else {
                const title = interaction.fields.getTextInputValue("title");
                const desc = interaction.fields.getTextInputValue("desc");
                const banner = interaction.fields.getTextInputValue("banner") || null;
                const cor = interaction.fields.getTextInputValue("cor") || "#00FFFF";
    
                await interaction.deferUpdate();
    
                await db.set("panel.mensagem.embeds", {
                    title,
                    desc,
                    banner,
                    cor
                });
    
                panelConfig(interaction);
            }
        }

        if(customId === "testmsg") {
            await interaction.deferUpdate();
            const panel = await db.get("panel");
            const components = [];
            const all = Object.entries(panel.functions);
            const row = new ActionRowBuilder();
            all.forEach((rs) => {
                const id = rs["0"];
                const data = rs["1"];
                if(panel.button) {
                    const button = new ButtonBuilder()
                    .setCustomId(id)
                    .setLabel(`${id} (Simulado)`)
                    .setStyle(2)
                    .setDisabled(true);
        
                    if(data.emoji) button.setEmoji(data.emoji);
                    
                    row.addComponents(button);
                };
            });
            if(all.length > 0) {
                if(!panel.button) {
                    components.push(
                        new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                            .setCustomId("asodnaisu")
                            .setPlaceholder("Selecione uma função")
                            .setMaxValues(1)
                            .setDisabled(true)
                            .setMinValues(1)
                            .addOptions(
                                {
                                    label:"asidnas",
                                    value:"soadmioas"
                                }
                            )
                        )
                    );
                } else {
                    components.push(row);
                }
            }
        
            let is;
            if(panel.mensagem.content) {
                is = {
                    content:`${panel.mensagem.msg.content}`,
                    components,
                    ephemeral: true
                };
            } else {
                const m = panel.mensagem.embeds;
                const embed1 = new EmbedBuilder()
                .setTitle(m.title)
                .setDescription(m.desc)
                .setImage(m.banner)
                .setColor(m.cor);
        
                is = {
                    content:``,
                    embeds: [embed1],
                    components,
                    ephemeral: true
                };
            };
            interaction.followUp(is);
        }

        if(customId === "postmsg") {
            interaction.update({
                content:`${interaction.user}, Selecione um canal para postar a mensagem`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                        .setCustomId("postmsgchannel")
                        .setMaxValues(1)
                        .setPlaceholder("Selecione um canal para postar a mensagem")
                        .setMinValues(1)
                        .setChannelTypes(ChannelType.GuildText)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("1215836101080776704")
                    )
                ]
            });
        }

        if(customId === "postmsgchannel") {
            const channel = interaction.guild.channels.cache.get(interaction.values[0]);
            await interaction.update({
                content:`Enviando mensagem...`,
                embeds: [],
                components: []
            });
            const panel = await db.get("panel");
            const components = [];
            const all = Object.entries(panel.functions);
            const row = new ActionRowBuilder();
            const select = new StringSelectMenuBuilder()
            .setCustomId("painel-ticket")
            .setPlaceholder("Selecione uma função")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((rs) => {
                const id = rs["0"];
                const data = rs["1"];
                if(panel.button) {
                    const button = new ButtonBuilder()
                    .setCustomId(id)
                    .setLabel(`${id}`)
                    .setStyle(2);
        
                    if(data.emoji) button.setEmoji(data.emoji);
                    
                    row.addComponents(button);
                } else {
                    const a = {
                        label:`${id}`,
                        value: id,
                        description:`${data.predesc}`
                    }
                    if(data.emoji) a.emoji = data.emoji
                    select.addOptions(a)
                }
            });
            if(all.length > 0) {
                if(!panel.button) {
                    components.push(
                        new ActionRowBuilder()
                        .addComponents(select)
                    );
                } else {
                    components.push(row);
                }
            }
        
            let is;
            if(panel.mensagem.content) {
                let files = [];
                if(panel.mensagem.msg.banner) {
                    files = [new AttachmentBuilder(panel.mensagem.msg.banner)]
                }
                is = {
                    content:`${panel.mensagem.msg.content}`,
                    components,
                    files
                };
            } else {
                const m = panel.mensagem.embeds;
                const embed1 = new EmbedBuilder()
                .setTitle(m.title)
                .setDescription(m.desc)
                .setImage(m.banner)
                .setColor(m.cor);
        
                is = {
                    content:``,
                    embeds: [embed1],
                    components,
                    ephemeral: true
                };
            };

            await channel.send(is);
            interaction.editReply({
                content:`Mensagem enviada com sucesso.`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setStyle(5)
                        .setLabel("Ir para Mensagem")
                    )
                ],
                embeds: []
            });
        }

    }
}