import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import RoleBot from '../../src/bot';

export enum Category {
  general = 'general',
  category = 'category',
  react = 'react',
}

export type CategoryStrings = keyof typeof Category;

export interface Command {
  name: string;
  desc: string;
  type: Category;
  data?: Pick<SlashCommandBuilder, 'toJSON'>;
  execute: (interaction: Interaction, client: RoleBot) => unknown;
}
