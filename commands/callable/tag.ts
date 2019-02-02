import { Message } from "discord.js";

function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

export default {
  desc: "Tag someone at random.",
  name: "tag",
  args: "",
  run: async (message: Message) => {
    const member = message.guild.members.random();
    message.channel.send(":thinking:...");
    await sleep(1000);
    message.channel.send(`${member!.user} tag; you're it!`);
  }
};
