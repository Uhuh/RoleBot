import errors from './json/errors.json';
import { codeBlock } from 'discord.js';
import { ChannelPing } from './utilPings';

/**
 * @TODO - Figure out i18n translations for this.
 */
export const requiredPermissions = (channelId: string) => {
  const resultString = errors['missing_permissions']
    .replace(/{{channel}}/g, ChannelPing(channelId))
    .replace(/{{permissions}}/g, codeBlock(errors['required_permissions']))
    .replace(
      /{{permission_reasons}}/g,
      codeBlock(errors['permission_reasons'])
    );

  return resultString;
};
