import { AutocompleteInteraction } from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../src/database/queries/category.query';

export async function handleAutocompleteCategory(
  interaction: AutocompleteInteraction
) {
  if (!interaction.guildId) return;

  const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

  const focusedValue = interaction.options.getFocused();
  const filtered = categories.filter((c) => c.name.startsWith(focusedValue));

  return interaction.respond(
    filtered.map((c) => ({ name: c.name, value: `${c.id}` }))
  );
}
