import { Message } from "discord.js";
import RoleBot from "../../src/bot";

export default {
  desc: "",
  name: "eval",
  args: "",
  type: "dev",
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (message.author.id !== client.config.DEV_ID) return;

    const clean = (text: string) => {
      if (typeof text === "string")
        return text
          .replace(/`/g, "`" + String.fromCharCode(8203))
          .replace(/@/g, "@" + String.fromCharCode(8203));
      else return text;
    };

    try {
      const code = args.join(" ");
      let evaled = eval(code);

      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

      message.channel.send(clean(evaled), { code: "xl" });
    } catch (err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
  }
};
