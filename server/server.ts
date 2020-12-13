import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();
import {
  guildReactions,
  guildFolders,
  removeReactionRole,
} from '../src/setup_table';
import emojis from './emojis';
import RoleBot from '../src';

const app = express();

const port = 8080;

app.use();

app.get('/unicode', (_req, res: express.Response) => {
  res.send(emojis);
});

app.use(function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  } else if (req.headers.authorization.split(' ')[0] !== 'Bearer') {
    return res.status(403).json({ error: 'Not a bearer token' });
  } else if (!req.headers.authorization.split(' ')[1]) {
    return res.status(403).json({ error: 'Missing token' });
  }
  return next();
});

// Make sure the request was made by me.
const middleWare = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    if (!req.headers.authorization) throw new Error('Missing auth');
    if (!process.env.JWT_SECRET) throw new Error('Missing secret');
    const token = req.headers.authorization.split(' ')[1] || 'Xd';
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

app.get(
  '/guild/:guildId',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { guildId } = req.params;
    const guild = RoleBot.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({
        error: 'Guild not found',
        id: guildId,
        request: 'Guild',
      });
    }

    return res.send({
      guild: guild,
      roles: guild.roles.cache
        .filter((r) => !r.managed)
        .map((r) => ({
          id: r.id,
          hexColor: r.hexColor,
          name: r.name,
          position: r.position,
        })),
      emojis: guild.emojis.cache,
    });
  }
);

app.get(
  '/reaction/:guildId',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { guildId } = req.params;
    const guildRoles = guildReactions(guildId);
    return res.send(guildRoles);
  }
);

app.post(
  '/reaction/:roleId/delete',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { roleId } = req.params;
    if (Number.isNaN(Number(roleId))) {
      return res.status(404).send({ error: 'Role ID sent is not a valid ID' });
    }
    try {
      removeReactionRole(roleId);
      res.send(roleId);
    } catch {
      res.status(404).send({ error: 'Issue deleting role', id: roleId });
    }
    return;
  }
);

app.post(
  '/reaction/create',
  middleWare,
  (req: express.Request, _res: express.Response) => {
    console.log(req.query);
  }
);

app.get(
  '/folder/:guildId',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { guildId } = req.params;
    const folder = guildFolders(guildId);
    res.send(folder);
  }
);

app.get(
  '/folder/:folderId/roles',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { folderId } = req.params;
    const roles = guildFolders(folderId);
    res.send(roles);
  }
);

app.get(
  '/roles/:guildId',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { guildId } = req.params;
    const guild = RoleBot.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({
        error: 'Guild not found',
        id: guildId,
        request: 'Roles',
      });
    }

    return res.send(guild.roles);
  }
);

app.get(
  '/emojis/:guildId',
  middleWare,
  (req: express.Request, res: express.Response) => {
    const { guildId } = req.params;
    const guild = RoleBot.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({
        error: 'Guild not found',
        id: guildId,
        request: 'Emojis',
      });
    }

    return res.send(guild.emojis);
  }
);

app.listen(port, () => {
  console.log(`Started listening on port ${port}`);
});
