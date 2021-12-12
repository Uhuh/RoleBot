import { Schema, Document, Model, model } from 'mongoose';

const ReactMessage = new Schema({
  categoryId: { type: Number },
  guildId: { type: String, required: true, unique: true, index: true },
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  roleId: { type: String, required: true },
  emojiId: { type: String, required: true },
});

export interface IReactMessage {
  categoryId?: number;
  guildId: string;
  messageId: string;
  channelId: string;
  roleId: string;
  emojiId: string;
}

export interface IReactMessageDoc extends IReactMessage, Document {}
export interface IReactMessageModel extends Model<IReactMessageDoc> {}
export default model<IReactMessageDoc>('ReactMessage', ReactMessage);
