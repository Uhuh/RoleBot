import { ShardingManager } from 'discord.js-light';
import { LogService } from './services/logService';

export class ShardHandler {
  log: LogService;
  manager: ShardingManager;

  constructor() {
    this.log = new LogService('ShardHandler');
    this.manager = new ShardingManager('./build/src/bot-start.js', {
      token: process.env.TOKEN,
    });

    this.manager.on('shardCreate', (shard) => {
      this.log.info(`Launched new shard[${shard.id}]`);
    });
  }

  startShards = async (numShards: number) => {
    this.log.info(`Spawning ${numShards} shards...`);
    this.manager
      .spawn({
        amount: numShards,
      })
      .catch((e) => this.log.error(`Failed to spawn shard.\n${e}`));
  };
}
