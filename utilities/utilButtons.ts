import { ActionRowBuilder } from '@discordjs/builders';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { ReactRole } from '../src/database/entities';
import { spliceIntoChunks } from './utils';

export const reactRoleButtons = (
  reactRoles: ReactRole[],
  hideEmojis: boolean
) => {
  const customId = (r: ReactRole) => `react-button_${r.id}-${r.categoryId}`;
  const buildButton = (r: ReactRole) => {
    const button = new ButtonBuilder()
      .setCustomId(customId(r))
      .setLabel(r.name)
      .setStyle(ButtonStyle.Secondary);

    if (hideEmojis) {
      return button;
    } else {
      return button.setEmoji(r.emojiId);
    }
  };

  return spliceIntoChunks(reactRoles, 5).map((roles) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(roles.map(buildButton))
  );
};
