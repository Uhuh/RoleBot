import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord.js';
import { SlashCommandTypes } from '../utilities/types/commands';

/**
 * @SlashBase Helps add options to the Discord Slash commands as they are unreasonable large to type out.
 */
export abstract class SlashBase {
  constructor(public data: SlashCommandTypes) {}

  addStringOption = (name: string, desc: string, required = false) => {
    if (this.data instanceof SlashCommandBuilder) {
      this.data.addStringOption((option) =>
        option.setName(name).setDescription(desc).setRequired(required)
      );
    }
  };

  addBoolOption = (name: string, desc: string, required = false) => {
    if (this.data instanceof SlashCommandBuilder) {
      this.data.addBooleanOption((option) =>
        option.setName(name).setDescription(desc).setRequired(required)
      );
    }
  };

  addChannelOption = (name: string, desc: string, required = false) => {
    if (this.data instanceof SlashCommandBuilder) {
      this.data.addChannelOption((option) =>
        option
          .addChannelTypes(ChannelType.GuildText)
          .setName(name)
          .setDescription(desc)
          .setRequired(required)
      );
    }
  };

  addRoleOption = (name: string, desc: string, required = false) => {
    if (this.data instanceof SlashCommandBuilder) {
      this.data.addRoleOption((option) =>
        option.setName(name).setDescription(desc).setRequired(required)
      );
    }
  };
}
