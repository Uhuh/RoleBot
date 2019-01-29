import { Message, Guild } from "discord.js";
import { removeChannel } from "../../src/setup_table";

export default {
  name: "removeChannel",
  run: (message: Message, args: string[]) => {
    const guild: Guild = message.guild;

    if (args.length == 1 && guild.channels.find(val => val.id === args[0])) {
      removeChannel.run(`${guild.id}-${args[0]}`, args[0]);
      message.react("✅");
      return;
    }
    message.react("❌");
  }
};
