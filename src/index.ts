import { ShardHandler } from './shardHandler';
import * as dotenv from 'dotenv';
import { SHARD_COUNT } from './vars';

dotenv.config();

const shardHandler = new ShardHandler();

void shardHandler.startShards(Number(process.env.SHARD_COUNT) ?? SHARD_COUNT);
