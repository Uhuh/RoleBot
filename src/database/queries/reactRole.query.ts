import { IsNull, Not } from 'typeorm';
import { displayOrderQuery } from '../../../utilities/utils';
import { Category, ReactRole } from '../entities';
import { DisplayType } from '../entities/category.entity';
import { ReactRoleType } from '../entities/reactRole.entity';

// React role related
export const CREATE_REACT_ROLE = async (
  name: string,
  description: string | undefined | null,
  roleId: string,
  emojiId: string,
  emojiTag: string | null,
  guildId: string,
  type: ReactRoleType,
) => {
  const reactRole = new ReactRole();

  reactRole.emojiId = emojiId;
  reactRole.emojiTag = emojiTag;
  reactRole.roleId = roleId;
  reactRole.guildId = guildId;
  reactRole.name = name;
  reactRole.description = description ?? undefined;
  reactRole.type = type;

  return await reactRole.save();
};

export const DELETE_REACT_ROLE_BY_ROLE_ID = (roleId: string) =>
  ReactRole.delete({ roleId });

export const DELETE_ALL_REACT_ROLES_BY_GUILD_ID = (guildId: string) =>
  ReactRole.delete({ guildId });

export const GET_REACT_ROLES_BY_GUILD = async (guildId: string) => {
  return ReactRole.find({
    where: { guildId },
    order: {
      name: 'ASC',
    },
    /* This is how you "include" join table entities in typeorm */
    relations: ['linkedRoles'],
  });
};

export const GET_REACT_ROLES_NOT_IN_CATEGORIES = (guildId: string) => {
  return ReactRole.find({
    where: { guildId, categoryId: IsNull() },
  });
};

export const GET_REACT_ROLE_BY_ID = (id: number) => {
  return ReactRole.findOne({
    where: {
      id,
    },
  });
};

export const GET_REACT_ROLE_BY_ROLE_ID = (roleId: string) => {
  return ReactRole.findOne({
    where: {
      roleId,
    },
  });
};

export const GET_GUILD_CATEGORY_ROLE_COUNT = (guildId: string) => {
  return ReactRole.count({
    where: {
      guildId,
      categoryId: Not(IsNull()),
    },
  });
};

export const GET_REACT_ROLES_BY_CATEGORY_ID = async (
  categoryId: number,
  displayType?: DisplayType,
) => {
  const orderProperties = displayOrderQuery(displayType);

  return await ReactRole.find({
    where: {
      category: {
        id: categoryId,
      },
    },
    order: orderProperties,
  });
};

export const UPDATE_REACT_ROLE_DESC = (roleId: string, description: string) =>
  ReactRole.update({ roleId }, { description });

export const UPDATE_REACT_ROLE_EMOJI_TAG = (
  roleId: string,
  emojiTag: string | null,
) => {
  return ReactRole.update({ roleId }, { emojiTag });
};

export const UPDATE_REACT_ROLE_EMOJI_ID = async (
  roleId: string,
  emojiId: string,
) => {
  const reactRole = await ReactRole.findOne({
    where: { roleId },
  });

  if (!reactRole)
    throw Error(`Role[${roleId}] doesn't exist despite having just found it.`);

  reactRole.emojiId = emojiId;

  return await reactRole.save();
};

export const GET_REACT_ROLE_BY_EMOJI = (emojiId: string, guildId: string) => {
  return ReactRole.findOne({ where: { emojiId, guildId } });
};

export const UPDATE_REACT_ROLE_CATEGORY = async (
  id: number,
  categoryId: number,
) => {
  const reactRole = await ReactRole.findOne({
    where: { id },
  });

  if (!reactRole) return;

  const category = await Category.findOne({ where: { id: categoryId } });

  if (!category) throw Error(`Category[${categoryId}] does not exist.`);

  reactRole.category = category;
  reactRole.categoryAddDate = new Date();

  return reactRole.save();
};

export const UPDATE_REACT_ROLE_BY_ID = (
  id: number,
  reactRole: Partial<ReactRole>,
) => {
  return ReactRole.update({ id }, reactRole);
};
