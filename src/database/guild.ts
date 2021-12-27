import { Schema, Document, Model, model } from 'mongoose';

const GuildConfig = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  joinRoles: {
    type: [String],
    default: [],
    maxlength: 5,
  },
});

export interface IGuildConfig {
  guildId: string;
  prefix: string;
  joinRoles: string[];
}

export interface IGuildConfigDoc extends IGuildConfig, Document {}
export interface IGuildConfigModel extends Model<IGuildConfigDoc> {}
export default model<IGuildConfigDoc>('GuildConfig', GuildConfig);
