import { Message, TextChannel } from "discord.js";
import { addReactMessage, rolesByFolderId } from "../../../src/setup_table";
import RoleBot from "../../../src/bot";

export default {
  desc: "Will watch a custom message for reactions.\nApply a folders roles instead by using the `-f` flag.",
  name: "reactMessage",
  args: "<message id> [-id <Folder id>]",
  type: "reaction",
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild) return;
    
    setTimeout(() => {
      message.delete();
    }, 5000);
    
    if (!message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");
    
    if (args.length === 0) return message.channel.send("No message id given.").then(m => setTimeout(() => m.delete(), 5000))

    const { guild } = message;
    const M_ID = args.shift();

    if (!M_ID) throw new Error("No M_ID given. >:(");

    let folder: { id: number; label: string} | undefined = undefined

    // Making sure the flag was used properly and that the folder exist.
    if (args.length === 2 && args[1] === "-id")
      return message.channel.send("No folder name given. Run `@RoleBot folders` to see folder names.")
              .then(m => setTimeout(() => m.delete(), 5000))
    else if (args.length === 2 && args[0] === "-id") {
      const GUILD_FOLDERS = client.guildFolders.get(guild.id)

      if (!GUILD_FOLDERS || !GUILD_FOLDERS.length)
        return message.channel.send("The server doesn't have any folders.")
                .then(m => setTimeout(() => m.delete(), 5000))

      args.shift()
      const ARRAY_ID = Number(args[0]);
      if (Number.isNaN(ARRAY_ID) || ARRAY_ID < 0 || ARRAY_ID >= GUILD_FOLDERS.length) {
        return message.channel.send("Incorrect folder ID given. Try running `@RoleBot folders`").then(m => setTimeout(() => m.delete(), 5000));
      }

      folder = GUILD_FOLDERS![ARRAY_ID];

      if (!folder)
        return message.channel.send(`Folder \`${ARRAY_ID}\` not found.`)
                .then(m => setTimeout(() => m.delete(), 5000))
    }

    for (const [, ch] of guild.channels) {
      if (ch instanceof TextChannel) {
        const msg = await ch.messages.fetch(M_ID).catch(console.log);

        if (!msg) continue;

        const { id } = folder || { id: null }
        const REACT_ROLES = rolesByFolderId(guild.id, id)

        REACT_ROLES.forEach(r => {
          msg.react(r.emoji_id);
        });

        addReactMessage(msg.id, ch.id, guild.id);
        client.reactMessage.set(msg.id, msg);

        break;
      }
    }

    return message.react("✅");
  }
};
