import { Schema, Document, Model, model } from 'mongoose';

const ReactMessage = new Schema({
  guildId: { type: String, required: true },
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  roleId: { type: String, required: true },
  emojiId: { type: String, required: true },
  categoryId: { type: Number },
});

export interface IReactMessage {
  guildId: string;
  messageId: string;
  channelId: string;
  roleId: string;
  emojiId: string;
  categoryId?: number;
}

export interface IReactMessageDoc extends IReactMessage, Document {}
export interface IReactMessageModel extends Model<IReactMessageDoc> {}
export default model<IReactMessageDoc>('ReactMessage', ReactMessage);
