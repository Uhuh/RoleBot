import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types';

export abstract class SlashBase {
  constructor(public data: SlashCommandBuilder) {}

  addStringOption = (name: string, desc: string, required = false) => {
    this.data.addStringOption((option) =>
      option.setName(name).setDescription(desc).setRequired(required)
    );
  };

  addChannelOption = (name: string, desc: string, required = false) => {
    this.data.addChannelOption((option) =>
      option
        .addChannelType(ChannelType.GuildText)
        .setName(name)
        .setDescription(desc)
        .setRequired(required)
    );
  };

  addRoleOption = (name: string, desc: string, required = false) => {
    this.data.addRoleOption((option) =>
      option.setName(name).setDescription(desc).setRequired(required)
    );
  };
}
