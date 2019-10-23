import {Message, Emoji} from "discord.js";
import {addReactionRole, addReactMessage} from '../../src/setup_table'
import RoleBot from '../../src/bot'

export default {
  desc: 'Create a message with reactions that toggle role assignment',
  name: 'reactRole',
  args: '[roleName reaction]...',
  run: async (originalMessage: Message, _args: string[], client: RoleBot) => {
    const [, , ...words] = originalMessage.content.split(/\s+/);
    const roles = words.filter((word, i) => word && i % 2 === 0);
    const GUILD_ID = originalMessage.guild.id;

    const reactions: any[] = words.filter((word, i) => word && i % 2 !== 0).map(reaction => {
      const match = /<:\w+:(\d+)>/.exec(reaction)
      if (match) {
        const [, id] = match
        console.log("match/id: ", match, id)
        return originalMessage.guild.emojis.get(id) as Emoji
      }
      return reaction
    });

    const reactionRoleMap: any = reactions.reduce((map, reaction, i) => ({
      ...map,
      [reaction.id || reaction]: roles[i]
    }), {})

    const roleReactions = roles.map((role, i) => role + " => " + reactions[i]);
    const sentMessage = await originalMessage.channel.send(roleReactions.join('\n')) as Message;

    client.reactMessage.set(sentMessage.id, sentMessage)

    addReactMessage(sentMessage.id, sentMessage.channel.id, GUILD_ID)

    // get MessageReaction from .react and send .emoji.id or .emoji.name to db?
    // get role id. Same role from db???
    const messageReactions = await Promise.all(reactions.map(reaction => sentMessage.react(reaction)));

    messageReactions.forEach(r => {
      console.log(r);
      const id = r.emoji.id || r.emoji.name;
      const roleName = reactionRoleMap[id];
      const role = originalMessage.guild.roles.find(({name}) => name === roleName)
      addReactionRole(id, role.id, role.name, GUILD_ID)
    })
  }
}
