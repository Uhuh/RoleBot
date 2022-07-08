import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import { CommandInteraction } from 'discord.js-light';
import RoleBot from '../../src/bot';

export enum Category {
  general = 'general',
  category = 'category',
  react = 'react',
}

export type SlashCommandTypes =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder;
export type CategoryStrings = keyof typeof Category;

export interface DataCommand {
  name: string;
  desc: string;
  type: Category;
  data: SlashCommandTypes;
  execute: (interaction: CommandInteraction, client: RoleBot) => unknown;
}
