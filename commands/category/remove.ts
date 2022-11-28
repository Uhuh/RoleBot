import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  DELETE_CATEGORY_BY_ID,
  GET_CATEGORY_BY_ID,
} from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { SlashSubCommand } from '../command';

export class RemoveSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'remove',
      'Delete a category. Deleting a category frees all roles it contains.',
      [
        {
          name: 'category',
          description: 'The category to delete.',
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
      ]
    );
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
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const categoryId = interaction.options.getString('category');
    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.error(
        `Category[${categoryId}] does not exist on guild.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! This is unusual, I couldn't find that category! Please try again after waiting a second.`
      );
    }

    DELETE_CATEGORY_BY_ID(category.id)
      .then(() => {
        this.log.info(
          `Successfully deleted category[${categoryId}]`,
          interaction.guildId
        );

        return interaction.editReply(
          `Hey! I successfully deleted the category \`${category.name}\` for you and freed all the roles on it.`
        );
      })
      .catch((e) => {
        this.log.error(
          `Issues deleting category[${categoryId}]\n${e}`,
          interaction.guildId
        );

        return interaction.editReply(
          `Hey! I had an issue deleting the category. Please wait a second and try again.`
        );
      });
  };
}
