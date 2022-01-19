import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import RoleBot from '../../src/bot';

export enum Category {
  general = 'general',
  category = 'category',
  react = 'react',
}

export type CategoryStrings = keyof typeof Category;

export interface DataCommand {
  name: string;
  desc: string;
  type: Category;
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction, client: RoleBot) => unknown;
}
