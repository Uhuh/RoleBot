import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import RoleBot from '../../src/bot';

export enum Category {
  general = 'general',
  category = 'category',
  react = 'react',
}

export type CategoryStrings = keyof typeof Category;

export interface BaseCommand {
  name: string;
  desc: string;
  type: Category;
  execute: (interaction: Interaction, client: RoleBot) => unknown;
}

export interface DataCommand extends BaseCommand {
  data: Pick<SlashCommandBuilder, 'toJSON' | 'name'>;
}
