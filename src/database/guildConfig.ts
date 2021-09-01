import { Schema, Document, Model, model } from 'mongoose';

const GuildConfig = new Schema({
  guildId: { type: BigInt, required: true, unique: true, index: true },
  prefix: { type: String, default: 'rb' },
  joinRoles: {
    type: [BigInt],
    default: [],
    maxlength: 5,
  },
});

export interface IGuildConfig {
  guildId: BigInt;
  prefix: string;
  joinRoles: BigInt[];
}

export interface IGuildConfigDoc extends IGuildConfig, Document {}
export interface IGuildConfigModel extends Model<IGuildConfigDoc> {}
export default model<IGuildConfigDoc>('GuildConfig', GuildConfig);
