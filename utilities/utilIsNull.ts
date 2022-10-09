import { ChatInputCommandInteraction } from 'discord.js';
import { Category } from '../src/database/entities';
import { LogService } from '../src/services/logService';
import { handleInteractionReply } from './utils';

/**
 * Expect every IsNull function to handle logging.
 * None of these functions should be true.
 */
const isNullLog = new LogService('IsNull');

export const isCategoryNull = (
  interaction: ChatInputCommandInteraction,
  category: Category | null,
  id: string | number | null
): category is null => {
  if (!category) {
    isNullLog.error(
      `[ ${interaction.commandName} ] Could not find category[${id}].`,
      interaction.guildId
    );

    handleInteractionReply(isNullLog, interaction, {
      ephemeral: true,
      content: `Hey! I can't find the category in my database! Please wait a second and try again.`,
    });
    return true;
  }

  return false;
};
