import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';

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
  data: SlashCommandBuilder;
  execute: (interaction: Interaction) => unknown;
}
