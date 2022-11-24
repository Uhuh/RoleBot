// Wonderfully hardcoded things.
export const OWNER_ID = '289151449412141076';
export const CLIENT_ID = process.env.CLIENT_ID || '493668628361904139';
export const SUPPORT_URL = 'https://discord.gg/9BYN266sC4';
export const AVATAR_URL =
  'https://cdn.discordapp.com/avatars/493668628361904139/712f1bc1af7f54da4693f0c361444244.webp?size=2048';
export const VOTE_URL = `https://top.gg/bot/${CLIENT_ID}/vote`;
export const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=741682757486510081&scope=bot%20applications.commands&permissions=2416035904&response_type=code&redirect_uri=https://rolebot.gg/`;

// .env stuff
export const TOKEN: string = process.env.TOKEN || '';
export const DB_NAME = process.env.DB_NAME || 'rolebotBeta';
export const POSTGRES_URL = `${process.env.POSTGRES_URL}${DB_NAME}` || '';
export const SHARD_COUNT = Number(process.env.SHARD_COUNT) || 6;
export const SERVER_ID = '567819334852804626';
// Only sync when in dev
export const SYNC_DB = Boolean(Number(process.env.SYNC_DB)) || false;

// Server webhook spam for basic info.
export const WEBHOOK_ID = process.env.WEBHOOK_ID || '';
export const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';

export const GUILD_WEBHOOK_ID = process.env.GUILD_WEBHOOK_ID || '';
export const GUILD_WEBHOOK_TOKEN = process.env.GUILD_WEBHOOK_TOKEN || '';

export const TUTORIAL_PLAYLIST =
  'https://www.youtube.com/watch?v=ikqTW4bbM7s&list=PLW0pJjCQgtaV2ukCIV_0h56Ld2wtKyvcR';
