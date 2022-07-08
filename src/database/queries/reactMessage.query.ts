import { Category, ReactMessage } from '../entities';
import { IReactMessage } from '../entities/reactMessage.entity';

// React role messages
export const CREATE_REACT_MESSAGE = async (
  reactMessageOptions: IReactMessage
) => {
  const reactMessage = new ReactMessage();

  reactMessage.channelId = reactMessageOptions.channelId;
  reactMessage.messageId = reactMessageOptions.messageId;
  reactMessage.emojiId = reactMessageOptions.emojiId;
  reactMessage.guildId = reactMessageOptions.guildId;
  reactMessage.roleId = reactMessageOptions.roleId;
  reactMessage.isCustomMessage = reactMessageOptions.isCustomMessage;

  const category = await Category.findOne({
    where: { id: reactMessageOptions.categoryId },
  });

  if (!category)
    throw Error(
      `Category[${reactMessageOptions.categoryId}] not found when creating react message.`
    );

  reactMessage.category = category;

  return reactMessage.save();
};

export const GET_REACT_MESSAGE_BY_CATEGORY_ID = async (categoryId: number) => {
  return await ReactMessage.findOne({
    where: { categoryId },
  });
};

export const GET_REACT_MESSAGE_BY_ROLE_ID = async (roleId: string) => {
  return await ReactMessage.findOne({ where: { roleId } });
};

export const GET_REACT_MESSAGE_BY_MESSAGE_ID = async (messageId: string) => {
  return (await ReactMessage.find({ where: { messageId } }))[0];
};

export const GET_REACT_MESSAGE_BY_MSGID_AND_EMOJI_ID = async (
  messageId: string,
  emojiId: string
) => {
  return await ReactMessage.findOne({ where: { messageId, emojiId } });
};

export const DELETE_REACT_MESSAGE_BY_ROLE_ID = async (roleId: string) => {
  return await ReactMessage.delete({ roleId });
};

export const DELETE_REACT_MESSAGES_BY_MESSAGE_ID = async (
  messageId: string
) => {
  return await ReactMessage.delete({ messageId });
};

export const DELETE_REACT_MESSAGES_BY_GUILD_ID = async (guildId: string) => {
  return await ReactMessage.delete({ guildId });
};
