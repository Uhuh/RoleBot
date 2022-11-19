import RB from './bot';
import * as i18n from 'i18n';
import path from 'path';

i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
});

const RoleBot = new RB();

RoleBot.start().catch((e) =>
  RoleBot.log.error(`RoleBot has encounter an error while starting up. ${e}`)
);

export default RoleBot;
