import { Schema, Document, Model, model } from 'mongoose';

interface ICategory {
  id: number;
  label: string;
  roleIds: BigInt[];
}

interface IRoleEmoji {
  categoryId: number;
  emojiId: string;
  roleId: BigInt;
}

interface IReactMessage {
  messageId: BigInt;
  channelId: BigInt;
}

const GuildInfo = new Schema({
  guildId: { type: BigInt, required: true, unique: true, index: true },
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
