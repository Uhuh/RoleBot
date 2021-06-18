import { Schema, Document, Model, model } from 'mongoose';

interface ICategory {
  id: number;
  label: string;
  roleIds: string[];
}

interface IRoleEmoji {
  categoryId: string;
  emojiId: string;
  roleId: string;
}

interface IReactMessage {
  messageId: string;
  channelId: string;
}

const GuildInfo = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  categories: {
    type: [],
    default: [],
  },
  reactRoles: {
    type: [],
    default: [],
  },
  reactMessage: {
    type: [],
    default: [],
  },
});

export interface IGuildInfo {
  guildId: string;
  categories: ICategory[];
  reactRoles: IRoleEmoji[];
  reactMessage: IReactMessage[];
}

export interface IGuildInfoDoc extends IGuildInfo, Document {}
export interface IGuildInfoModel extends Model<IGuildInfoDoc> {}
export default model<IGuildInfoDoc>('GuildInfo', GuildInfo);
