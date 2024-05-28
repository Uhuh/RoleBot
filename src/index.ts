import * as dotenv from 'dotenv';
import { LogService } from './services/logService';
import { ShardHandler } from './shardHandler';

dotenv.config();

const shardHandler = new ShardHandler();

void shardHandler.startShards();