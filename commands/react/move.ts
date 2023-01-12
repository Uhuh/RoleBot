import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  codeBlock,
} from 'discord.js';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import {
  GET_REACT_ROLE_BY_ROLE_ID,
  UPDATE_REACT_ROLE_CATEGORY,
} from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { RolePing } from '../../utilities/utilPings';
import { SlashSubCommand } from '../command';

export class MoveSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'move', 'Move a react role between categories.', [
      {
        name: 'role',
        description:
          'The role that belongs to the react role you want to move.',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
      {
        name: 'category',
        description: 'The category to move the react role to.',
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: true,
      },
    ]);
  }

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      await handleAutocompleteCategory(interaction);
    } catch (e) {
      this.log.error(`Failed to get categories for autocomplete.\n${e}`);

      await interaction.respond([
        { name: `SHOULD NOT SEE THIS! :)`, value: 'oopsies!' },
      ]);
    }
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    await interaction.deferReply({
      ephemeral: true,
    });

    const role = this.expect(interaction.options.getRole('role'), {
      message: `Hey! I can't find that role.`,
      prop: 'role',
    });

    const categoryId = this.expect(interaction.options.getString('category'), {
      message: `Hey! I had an issue parsing the category.`,
      prop: 'categoryId',
    });

    const category = this.expect(
      await GET_CATEGORY_BY_ID(interaction.guildId, Number(categoryId)),
      {
        message: `Hey! I had an issue finding the category in my database. Please wait and try again.`,
        prop: 'category',
      }
    );

    const reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (!reactRole) {
      return interaction.editReply(
        `Hey! The role ${RolePing(role.id)} doesn't belong to a react role.`
      );
    }

    try {
      await UPDATE_REACT_ROLE_CATEGORY(reactRole.id, Number(categoryId));

      await interaction.editReply(
        `Hey! I updated ${RolePing(role.id)}'s category to be ${category.name}`
      );
    } catch (e) {
      await interaction.editReply(
        `Hey! I had an issue updating the category. Here's an error message.\n
        ${codeBlock(`${e}`)}`
      );
    }
  };
}
