import { Colors, EmbedBuilder } from 'discord.js';
import { COLOR } from './types/globals';
import { Category, DisplayType, ICategory, } from '../src/database/entities/category.entity';
import { ReactRole } from '../src/database/entities';
import { codeBlock } from '@discordjs/builders';
import { AVATAR_URL } from '../src/vars';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../src/database/queries/reactRole.query';
import { RolePing } from './utilPings';
import { Category as CommandCategory } from './types/commands';
import tutorialJson from './json/tutorial.json';
import commands from './json/commands.json';
import { GuildReactType, IGuildConfig, } from '../src/database/entities/guild.entity';

/**
 * Generate a help embed based on the category type passed in.
 * @param type @Category type to filter out commands.
 * @returns Return built embed
 */
export function helpEmbed(type: CommandCategory) {
  const embed = new EmbedBuilder();

  embed.setTitle(`**${type.toUpperCase()} commands**`).setColor(COLOR.AQUA);

  commands[type].forEach((func) =>
    embed.addFields({ name: `/${func.name}`, value: func.description })
  );

  return embed;
}

const DisplayOrderMap = new Map([
  [DisplayType.alpha, 'Alphabetical'],
  [DisplayType.reversedAlpha, 'Reversed alphabetical'],
  [DisplayType.time, 'Insertion order'],
  [DisplayType.reversedTime, 'Reversed insertion'],
]);

/**
 * Generate an embed that contains all the emojis to roles in a category.
 * @param category Category to parse roles from.
 * @returns built embed.
 */
export async function categoryReactRoleEmbed(category: Category) {
  const embed = new EmbedBuilder();
  const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(
    category.id,
    category.displayOrder
  );

  const reactRoles = categoryRoles.length
    ? reactRolesFormattedString(categoryRoles)
    : `This category has no react roles! Add some react roles to this category by using \`/category add\`!`;

  const desc =
    category.description === '' || !category.description
      ? 'Description not set. Set it in `/category edit`'
      : category.description;

  const displayOrder = DisplayOrderMap.get(category.displayOrder);
  const none = '**None!**';

  embed
    .setTitle(category.name)
    .setDescription(
      `Required Role: ${category.requiredRoleId ? RolePing(category.requiredRoleId) : none}\n` +
      `Excluded Role: ${category.excludedRoleId ? RolePing(category.excludedRoleId) : none}\n\n` +
      `Display order: **${displayOrder}**\n\n` +
      `Mutually exclusive: **${category.mutuallyExclusive}**\n\n` +
      `Embed color: #${category.embedColor ?? none}\n` +
      `Image URL: ${category.imageUrl ?? none}\n` +
      `Image Type: ${category.imageType}\n\n` +
      `Description: **${desc.split('\\n').join('\n')}**\n\n` +
      `React Roles\n${reactRoles}`
    )
    .setColor(category.embedColor ? `#${category.embedColor}` : null);

  return embed;
}

function reactRolesFormattedString(
  reactRoles: ReactRole[],
  hideEmojis = false
) {
  const emoji = (r: ReactRole) => r.emojiTag ?? r.emojiId;

  return reactRoles
    .map(
      (r) =>
        `${hideEmojis ? '' : emoji(r) + ' - '}${RolePing(r.roleId)} ${
          r.description ?? ''
        }`
    )
    .join('\n');
}

/**
 * Build a single embed to list all roles and their associated emoji.
 * @param reactRoles List of all react roles in a guild.
 * @returns Built embed for caller command to send.
 */
export function reactRoleListEmbed(reactRoles: ReactRole[]) {
  const embed = new EmbedBuilder();

  const rolesNotInCategory = reactRoles.filter((r) => !r.categoryId);
  const rolesInCategory = reactRoles.filter((r) => r.categoryId);

  const inCategory = rolesInCategory.length
    ? `**In a category:**\n${reactRolesFormattedString(
      rolesInCategory
    )}\n`
    : '';

  const notInCategory = rolesNotInCategory.length
    ? `**Not in a category:**\n${reactRolesFormattedString(
      rolesNotInCategory
    )}`
    : '';

  embed
    .setTitle(`All your reaction roles!`)
    .setDescription(
      `This doesn't show what categories these roles are in.\nCheck out \`/category list\` for more in-depth listing.\n\n${inCategory}${notInCategory}`
    )
    .setColor(COLOR.DEFAULT);

  return embed;
}

export async function freeReactRoles(reactRoles: ReactRole[]) {
  const embed = new EmbedBuilder();

  embed.setTitle(`React roles not in a category`).setColor(COLOR.YELLOW);

  embed.setDescription(
    `These roles are up for grabs!\nCheck out \`/category add\` if you want to add these to a category.\n\n${reactRolesFormattedString(
      reactRoles
    )}`
  );

  return embed;
}

export function reactRoleEmbed(
  reactRoles: ReactRole[],
  category: ICategory,
  hideEmojis = false
) {
  const embed = new EmbedBuilder();

  const description = reactRoleEmbedless(
    reactRoles,
    category,
    hideEmojis
  );

  /**
   * Setting the image can throw errors if empty string gets through.
   * When a category is edited it should be set to null, but just in case.
   */
  try {
    embed
      .setTitle(category.name)
      .setDescription(description)
      .setColor(category.embedColor ? `#${category.embedColor}` : null);

    if (category.imageType === 'card') {
      embed.setImage(category.imageUrl);
    } else {
      embed.setThumbnail(category.imageUrl);
    }
  } catch (e) {
    console.error(e);
  }

  return embed;
}

export function reactRoleEmbedless(
  reactRoles: ReactRole[],
  category: ICategory,
  hideEmojis = false
) {
  const reactRolesString = reactRolesFormattedString(
    reactRoles,
    hideEmojis
  );

  const requiredRole = category.requiredRoleId
    ? `\nRequired: ${RolePing(category.requiredRoleId)}`
    : '';

  const excludedRole = category.excludedRoleId
    ? `\nExcluded: ${RolePing(category.excludedRoleId)}`
    : '';

  return `${
    category.description?.split('\\n').join('\n') ?? ''
  }${requiredRole}${excludedRole}\n\n${reactRolesString}`;
}

export function tutorialEmbed(pageId: number) {
  /* Extract out all of the embed info needed to make this. Should be simple. */
  const embedJson = tutorialJson['embeds'][pageId];
  const embed = new EmbedBuilder();

  embed
    .setColor(COLOR.DEFAULT)
    .setTitle(embedJson.title)
    .setDescription(embedJson.description.join('\n'))
    .setImage(embedJson.image);

  return embed;
}

export function joinRoleEmbed(roleIds: string[]) {
  const embed = new EmbedBuilder();

  embed
    .setTitle(`Server auto join roles.`)
    .setColor(Colors.Green)
    .setDescription(
      `These roles are given to users as they join your server.\nCurrently the max limit a server can have is 5.\n\n` +
      (roleIds.length > 0
        ? roleIds.map((r) => RolePing(r)).join('\n')
        : `There are none! Go add some with the \`/auto-join add @Role\` command.`)
    )
    .setTimestamp(new Date());

  return embed;
}

export function errorEmbed(content: string) {
  const embed = new EmbedBuilder();

  embed
    .setColor(Colors.Red)
    .setAuthor({ name: 'RoleBot', iconURL: AVATAR_URL })
    .setTitle(`Encountered an error`)
    .setDescription(codeBlock('diff', content))
    .setTimestamp(new Date());

  return embed;
}

export async function guildConfig(config: IGuildConfig) {
  const embed = new EmbedBuilder();
  const description = `**Hey! If you changed your react type your old messages/buttons will be invalid.\nIf you swap back and haven't deleted those messages then they're still valid. Just make sure the types match for what you want.**`;

  embed
    .setColor(Colors.Red)
    .setAuthor({ name: 'RoleBot', iconURL: AVATAR_URL })
    .setTitle('Server configuration.')
    .setDescription(
      description +
      `\n\nReact type: **${
        GuildReactType[config.reactType]
      }**\nHide button emojis: **${config.hideEmojis}**\nHide embeds: **${
        config.hideEmbed
      }**`
    )
    .setTimestamp(new Date());

  return embed;
}
