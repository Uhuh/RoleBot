import { ShardingManager } from 'discord.js';
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
      this.log.info(`Launching new shard[${shard.id}]`);

      shard.on('death', () => this.log.critical(`Shard[${shard.id}] died.`));
      shard.on('spawn', () =>
        this.log.info(`Shard[${shard.id}] successfully spawned`)
      );
      shard.on('disconnect', () =>
        this.log.critical(`Shard[${shard.id}] disconnected.`)
      );
      shard.on('reconnecting', () =>
        this.log.debug(`Shard[${shard.id}] attempting to reconnect.`)
      );
      shard.on('error', (e) =>
        this.log.error(`Shard[${shard.id}] errored.\n${e}`)
      );
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
