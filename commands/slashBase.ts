import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types';

/**
 * @SlashBase Helps add options to the Discord Slash commands as they are unreasonable large to type out.
 */
export abstract class SlashBase {
  constructor(public data: SlashCommandBuilder) { }

  addStringOption = (name: string, desc: string, required = false) => {
    this.data.addStringOption((option) =>
      option.setName(name).setDescription(desc).setRequired(required)
    );
  };

  addBoolOption = (name: string, desc: string, required = false) => {
    this.data.addBooleanOption((option) =>
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
