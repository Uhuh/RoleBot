import RoleBot from '../src/bot';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handleRawPacket = (r: any, _client: RoleBot) => {
  switch (r.t) {
    case 'MESSAGE_REACTION_ADD':
      _client.emit('MESSAGE_REACTION_ADD', r.d);
      break;
    case 'MESSAGE_REACTION_REMOVE':
      _client.emit('MESSAGE_REACTION_REMOVE', r.d);
      break;
  }
};
