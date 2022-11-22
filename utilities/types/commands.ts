import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import RoleBot from '../../src/bot';

export enum Category {
  general = 'general',
  category = 'category',
  react = 'react',
  owner = 'owner',
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
  execute: (
    interaction: ChatInputCommandInteraction,
    client: RoleBot
  ) => unknown;
}
