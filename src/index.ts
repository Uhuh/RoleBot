import { ShardHandler } from './shardHandler';
import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { LogService } from './services/logService';
import {
  Category,
  GuildConfig,
  ReactMessage,
  ReactRole,
} from './database/entities';
dotenv.config();

async function start() {
  const log = new LogService('Start');
  await createConnection({
    type: 'postgres',
    url: 'postgres://panku:panku@192.168.50.36:5432/rolebot-beta',
    entities: [ReactMessage, ReactRole, Category, GuildConfig],
  })
    .then(() => {
      log.debug(`Successfully connected to postgres DB.`);
    })
    .catch((e) => {
      log.critical(`Failed to connect to postgres.`);
      log.critical(`${e}`);
    });

  const shardHandler = new ShardHandler();

  shardHandler.startShards(1);
}

start();
