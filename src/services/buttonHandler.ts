import { ButtonInteraction, GuildMember } from 'discord.js';
import { RolePing } from '../../utilities/utilPings';
import { ReactRole } from '../database/entities';
import { ICategory } from '../database/entities/category.entity';
import { GuildReactType } from '../database/entities/guild.entity';
import {
  GET_CATEGORY_BY_ID,
  GET_ROLES_BY_CATEGORY_ID,
} from '../database/queries/category.query';
import {
  CREATE_GUILD_CONFIG,
  GET_GUILD_CONFIG,
} from '../database/queries/guild.query';
import { GET_REACT_ROLE_BY_ID } from '../database/queries/reactRole.query';
import { LogService } from './logService';

export class ButtonHandler {
  private static log = new LogService('ButtonHandler');

  public static handleButton = async (
    interaction: ButtonInteraction,
    args: string[]
  ) => {
    if (!interaction.guildId) return;
    const { guildId } = interaction;

    let config = await GET_GUILD_CONFIG(guildId);
    if (!config) {
      config = await CREATE_GUILD_CONFIG(guildId);
    }

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

    const handleError = (
      interaction: ButtonInteraction,
      error: unknown,
      type: 'add' | 'remove'
    ) => {
      this.log.debug(
        `Failed to ${type} role[${reactRole.roleId}] user[${member.id}]\n${error}`
      );

      return interaction.editReply(
        `Hey! I couldn't ${type} the role ${RolePing(
          reactRole.roleId
        )}. Do I have manage role permissions?`
      );
    };

    // Remove the role if the user has it. Should catch mutually exclusive removes too.
    if (member.roles.cache.has(reactRole.roleId)) {
      member.roles
        .remove(reactRole.roleId)
        .catch((e) => handleError(interaction, e, 'remove'));

      return interaction.editReply(
        `Hey! I remove the role ${RolePing(
          reactRole.roleId
        )} from you successfully.`
      );
    }

    if (category.mutuallyExclusive) {
      await ButtonHandler.mutuallyExclusive(
        interaction,
        member,
        category,
        reactRole
      );
    } else {
      member.roles
        .add(reactRole.roleId)
        .catch((e) => handleError(interaction, e, 'add'));

      return interaction.editReply(
        `Hey! I added the role ${RolePing(
          reactRole.roleId
        )} to you successfully.`
      );
    }
  };

  public static mutuallyExclusive = async (
    interaction: ButtonInteraction,
    member: GuildMember,
    category: ICategory,
    role: ReactRole
  ) => {
    const roles = (
      await GET_ROLES_BY_CATEGORY_ID(category.id, category.displayOrder)
    ).map((r) => r.roleId);

    const rolesToRemove = member.roles.cache.filter((r) =>
      roles.includes(r.id)
    );

    await member.roles.remove(rolesToRemove).catch((e) => {
      this.log.error(
        `Failed to remove roles[${rolesToRemove}] from user[${member.id}]\n${e}`
      );

      return interaction.editReply(
        `Hey! I couldn't remove some mutually exclusive roles from you. Do I have the manage role permission?`
      );
    });

    await member.roles.add(role.roleId).catch((e) => {
      this.log.error(
        `Failed to add role[${role.roleId}] from user[${member.id}]\n${e}`
      );

      return interaction.editReply(
        `Hey! I couldn't add the role ${RolePing(
          role.roleId
        )}. Do I the manage roles permission?`
      );
    });

    return interaction.editReply(
      `Hey! I gave you the ${RolePing(
        role.roleId
      )} role and removed ${rolesToRemove.map((r) => RolePing(r.id)).join(' ')}`
    );
  };
}
