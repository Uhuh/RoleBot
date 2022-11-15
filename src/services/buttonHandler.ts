import { ButtonInteraction } from 'discord.js';
import { RolePing } from '../../utilities/utilPings';
import { GuildReactType } from '../database/entities/guild.entity';
import { GET_CATEGORY_BY_ID } from '../database/queries/category.query';
import { GET_GUILD_CONFIG } from '../database/queries/guild.query';
import { GET_REACT_ROLE_BY_ID } from '../database/queries/reactRole.query';
import { LogService } from './logService';

export class ButtonHandler {
  private static log = new LogService('ButtonHandler');

  public static handleButton = async (
    interaction: ButtonInteraction,
    args: string[]
  ) => {
    if (!interaction.guildId) return;

    const config = await GET_GUILD_CONFIG(interaction.guildId);

    /**
     * Ignore request if the server react type isn't button related.
     * This can happen if users swap types and leave old messages up.
     */
    if (config?.reactType !== GuildReactType.button) {
      return interaction.editReply(
        `Hey! The server doesn't use button roles! The button you clicked must be out of date.`
      );
    }

    const [reactRoleId, categoryId] = args;

    if (isNaN(Number(reactRoleId)) || isNaN(Number(categoryId))) {
      return interaction.editReply(
        `Hey! Something went wrong with processing that button press! reactRoleId: ${reactRoleId} | categoryId: ${categoryId}`
      );
    }

    const reactRole = await GET_REACT_ROLE_BY_ID(Number(reactRoleId));
    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!reactRole || !category) {
      return interaction.editReply(
        `Hey! I failed to find the react role or category related to this button.`
      );
    }

    const member = await interaction.guild?.members
      .fetch(interaction.user.id)
      .catch((e) =>
        this.log.error(
          `Fetching user[${interaction.user.id}] threw an error.\n${e}`
        )
      );

    if (!member) {
      this.log.debug(
        `Failed to grab member object from interaction.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Heyo! I had some issues finding _you_ here.`
      );
    }

    // If the category limits who can react and the user doesn't have said role ignore request.
    if (
      category.requiredRoleId &&
      !member.roles.cache.has(category.requiredRoleId)
    ) {
      // Remove reaction as to not confuse the user that they succeeded.
      return interaction.editReply(
        `Hey! You lack the required role to get anything from this category. ${RolePing(
          category.requiredRoleId
        )}`
      );
    }

    // If the category has an excluded role, and the user has said excluded role, ignore request.
    if (
      category.excludedRoleId &&
      member.roles.cache.has(category.excludedRoleId)
    ) {
      return interaction.editReply(
        `Heyo! You have a role that prevents you from obtaining anything from this category. ${RolePing(
          category.excludedRoleId
        )}`
      );
    }

    // @TODO - Handle mutually exclusive.

    if (member.roles.cache.has(reactRole.roleId)) {
      member.roles.remove(reactRole.roleId).catch((e) => {
        this.log.debug(
          `Failed to remove role[${reactRole.roleId}] from user[${member.id}]\n${e}`
        );

        return interaction.editReply(
          `Hey! I had issues removing the role ${RolePing(
            reactRole.roleId
          )}. Do I have manage role permissions?`
        );
      });

      return interaction.editReply(
        `Hey! I remove the role ${RolePing(
          reactRole.roleId
        )} from you successfully.`
      );
    } else {
      member.roles.add(reactRole.roleId).catch((e) => {
        this.log.debug(
          `Failed to add role[${reactRole.roleId}] to user[${member.id}]\n${e}`
        );

        return interaction.editReply(
          `Hey! I had issues adding the role ${RolePing(
            reactRole.roleId
          )}. Do I have manage role permissions?`
        );
      });

      return interaction.editReply(
        `Hey! I added the role ${RolePing(
          reactRole.roleId
        )} to you successfully.`
      );
    }

    return;
  };
}
