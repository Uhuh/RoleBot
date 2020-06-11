import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
dotenv.config();
import { guildReactions, guildFolders } from '../src/setup_table';
import emojis from './emojis';
import RoleBot from '../src';

const app = express();

const port = 8080;

app.use(cors());

app.get('/unicode', (_req, res: express.Response) => {
  res.send(emojis);
});

app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log('Heyo')
  if(!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  } else if(req.headers.authorization.split(' ')[0] !== 'Bearer') {
    return res.status(403).json({ error: 'Not a bearer token' });
  } else if(!req.headers.authorization.split(' ')[1]) {
    return res.status(403).json({ error: 'Missing token' });
  }
  return next();
});

// Make sure the request was made by me.
const middleWare = (
  req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if(!req.headers.authorization) throw new Error('Missing auth');
    if(!process.env.JWT_SECRET) throw new Error('Missing secret');
    const token = req.headers.authorization.split(' ')[1] || 'Xd';
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

app.get('/guild/:guildId', middleWare, (req: express.Request, res: express.Response) => {
  const { guildId } = req.params;
  const guild = RoleBot.guilds.cache.get(guildId);

  if(!guild) {
    return res.status(404).json({
      error: 'Guild not found',
      id: guildId,
      request: 'Guild'
    });
  }  
  
  return res.send({
    guild: guild,
    roles: guild.roles.cache.map(r => (
      {
        id: r.id,
        hexColor: r.hexColor,
        name: r.name,
        position: r.position
      }
    )),
    emojis: guild.emojis.cache
  });
});


app.get('/reaction/:guildId', middleWare, (req: express.Request, res: express.Response) => {
  const { guildId } = req.params;
  const guildRoles = guildReactions(guildId);
  return res.send(guildRoles);
});

app.get('/folder/:guildId', middleWare, (req: express.Request, res: express.Response) => {
  const { guildId } = req.params;
  const folder = guildFolders(guildId);
  res.send(folder);
});

app.get('/roles/:guildId', middleWare, (req: express.Request, res: express.Response) => {
  const { guildId } = req.params;
  const guild = RoleBot.guilds.cache.get(guildId);

  if(!guild) {
    return res.status(404).json({
      error: 'Guild not found',
      id: guildId,
      request: 'Roles'
    });
  }

  return res.send(guild.roles);
});

app.get('/emojis/:guildId', middleWare, (req: express.Request, res: express.Response) => {
  const { guildId } = req.params;
  const guild = RoleBot.guilds.cache.get(guildId);

  if(!guild) {
    return res.status(404).json({
      error: 'Guild not found',
      id: guildId,
      request: 'Emojis'
    });
  }

  return res.send(guild.emojis);
});

app.listen(port, () => {
  console.log(`Started listening on port ${port}`);
})