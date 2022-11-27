import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from 'discord.js';
import { handleAutocompleteCategory } from '../../../utilities/utilAutocomplete';
import { SlashSubCommand } from '../command';

export class AddSubCommand extends SlashSubCommand {
  constructor() {
    super('add', 'Add react roles to your category', [
      {
        name: 'category',
        description: 'The category to add to.',
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
}
