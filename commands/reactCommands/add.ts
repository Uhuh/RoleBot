import { Message } from "discord.js";
import { addReactionRole, getRoleByReaction, getRoleByName  } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Associate an emoji with a role.\nExample `rb reaction add Member | :D`",
  name: "add",
  args: "<Role name> | <Emoji>",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return;

    const [roleName, emojiId] = args.join(' ').split('|').map(l => l.trim());
    let emoji = emojiId;
  
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
  
    if(!role) {
      return message.channel.send(`Unable to find role \`${roleName}\`. Check for typos!`);
    } else {
      const reaction = getRoleByName(role.name, message.guild.id);
      if(reaction) {
        return message.channel.send(`Role \`${role.name}\` is already being used.`);
      }
    }

    if(!emoji || emoji === '') {
      return message.channel.send(`You need to include an emoji.`);
    }

    const match = /:(\d+)>/.exec(emojiId);
  
    if(match) {
      const [, id] = match;
      if (!client.emojis.cache.get(id)) {
        return message.channel.send(`Couldn't find emoji ${emojiId}.`)
      }
      emoji = id;
    }
    const reaction = getRoleByReaction(emoji, message.guild.id);
    if(reaction) {
      return message.channel.send(`Emoji is already being used by \`${reaction.role_name}\``);
    }

    addReactionRole(emoji, role.id, role.name, message.guild.id);
    return message.react("✅");
  }
};