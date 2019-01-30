import { Message, Guild } from "discord.js";
import { addChannel } from "../../src/setup_table";

export default {
  name: "roleChannel",
  run: (message: Message, args: string[]) => {
    console.log("Hmmm");
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;

    let channel: any = {};
    const guild: Guild = message.guild;
    if (args.length == 1 && guild.channels.find(val => val.id === args[0])) {
      channel = {
        id: `${guild.id}-${args[0]}`,
        channel_id: args[0],
        guild: guild.id
      };
      addChannel.run(channel);
      message.react("✅");
      return;
    }
    message.react("❌");
  }
};
