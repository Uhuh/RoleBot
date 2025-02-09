import { AutocompleteInteraction } from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_GUILD } from '../src/database/queries/reactRole.query';

export async function handleAutocompleteCategory(
  interaction: AutocompleteInteraction,
) {
  if (!interaction.guildId) return;

  const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

  const focusedValue = interaction.options.getFocused().toLowerCase();
  const filtered = categories.filter((c) => c.name.toLowerCase().startsWith(focusedValue));

  return interaction.respond(
    filtered.map((c) => ({ name: c.name, value: `${c.id}` })),
  );
}

export async function handleAutocompleteReactRoles(
  interaction: AutocompleteInteraction
) {
  if (!interaction.guildId) return;

  const reactRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

  const focusedValue = interaction.options.getFocused().toLowerCase();
  const filtered = reactRoles.filter((rr) => rr.name.toLowerCase().startsWith(focusedValue));

  return interaction.respond(
    filtered.map((rr) => ({ name: rr.name, value: `${rr.id}` }))
  );
}
