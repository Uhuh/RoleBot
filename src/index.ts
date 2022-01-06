import { ShardHandler } from './shardHandler';
import * as dotenv from 'dotenv';
import { SHARD_COUNT } from './vars';
dotenv.config();

const shardHandler = new ShardHandler();

shardHandler.startShards(SHARD_COUNT);
