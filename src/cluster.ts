import { ClusterManager } from 'discord-hybrid-sharding';
import { LogService } from './services/logService';

const logger = new LogService('ClusterManager');

const manager = new ClusterManager('.build/src/bot-start.js', {
  totalShards: 'auto',
  shardsPerClusters: 2,
  mode: 'process',
  token: process.env.TOKEN,
});

manager.on('clusterCreate', cluster => logger.info(`Launched Cluster ${cluster.id}`));
manager.spawn({ timeout: -1 });