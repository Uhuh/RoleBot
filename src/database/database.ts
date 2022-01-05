import { Category, ReactMessage, ReactRole } from './entities';
import { ICategory } from './entities/category.entity';
import { IReactMessage } from './entities/reactMessage.entity';
import { ReactRoleType } from './entities/reactRole.entity';

// React role related
export const CREATE_REACT_ROLE = async (
  name: string,
  roleId: string,
  emojiId: string,
  guildId: string,
  type: ReactRoleType
) => {
  const reactRole = new ReactRole();

  reactRole.emojiId = emojiId;
  reactRole.roleId = roleId;
  reactRole.guildId = guildId;
  reactRole.name = name;
  reactRole.type = type;

  return await reactRole.save();
};

export const DELETE_REACT_ROLE_BY_ROLE_ID = async (roleId: string) => {
  return await ReactRole.delete({ roleId });
};

export const GET_REACT_ROLES_BY_GUILD = async (guildId: string) => {
  return await ReactRole.find({ where: { guildId } });
};

export const GET_REACT_ROLES_NOT_IN_CATEGORIES = async (guildId: string) => {
  return await ReactRole.find({
    where: { guildId, category: null },
  });
};

export const GET_REACT_ROLE_BY_ROLE_ID = async (id: string) => {
  return await ReactRole.findOne({
    where: {
      id,
    },
  });
};

export const GET_REACT_ROLES_BY_CATEGORY_ID = async (categoryId: string) => {
  return await ReactRole.find({
    where: {
      category: {
        id: categoryId,
      },
    },
  });
};

export const GET_REACT_ROLE_BY_EMOJI = async (
  emojiId: string,
  guildId: string
) => {
  return await ReactRole.findOne({ where: { emojiId, guildId } });
};

export const UPDATE_REACT_ROLE_CATEGORY = async (
  id: string,
  categoryId: string
) => {
  const reactRole = await ReactRole.findOne({
    where: { id },
  });

  if (!reactRole) return;

  const category = await Category.findOne({ where: { id: categoryId } });

  reactRole.category = category;
  return reactRole.save();
};

// React role messages
export const CREATE_REACT_MESSAGE = (reactMessageOptions: IReactMessage) => {
  const reactMessage = new ReactMessage();

  reactMessage.channelId = reactMessageOptions.channelId;
  reactMessage.messageId = reactMessageOptions.messageId;
  reactMessage.emojiId = reactMessageOptions.emojiId;
  reactMessage.guildId = reactMessageOptions.guildId;
  reactMessage.roleId = reactMessageOptions.roleId;

  return reactMessage.save();
};

export const GET_REACT_MSG = async (messageId: string, emojiId: string) => {
  return await ReactMessage.findOne({ where: { messageId, emojiId } });
};

// Guild categories
export const GET_GUILD_CATEGORIES = async (guildId: string) => {
  return await Category.find({ where: { guildId } });
};

export const GET_ROLES_BY_CATEGORY_ID = async (categoryId: string) => {
  return await ReactRole.find({ where: { category: { id: categoryId } } });
};

export const CREATE_GUILD_CATEGORY = async (
  guildId: string,
  name: string,
  description: string | undefined
) => {
  const category = new Category();

  category.guildId = guildId;
  category.name = name;
  category.description = description;

  return await category.save();
};

export const EDIT_CATEGORY_BY_ID = (
  id: string,
  category: Partial<ICategory>
) => {
  return Category.update({ id }, category);
};

export const GET_CATEGORY_BY_NAME = async (guildId: string, name: string) => {
  return await Category.findOne({ where: { guildId, name } });
};

export const GET_CATEGORY_BY_ID = (id: string) => {
  return Category.findOne({ where: { id } });
};

export const DELETE_CATEGORY_BY_ID = (id: string) => {
  return Category.delete({ id });
};
