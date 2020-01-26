import { Message, TextChannel } from "discord.js";
import { addReactionRole, guildReactions, addFolder, folderId } from "../../src/setup_table";
import RoleBot, { Role } from "../../src/bot";

export default {
  desc: "Associate an emoji with a role.\nCan create a role folder to send reaction roles in a different message. If creating afolder, it will continue to ask for roles.",
  name: "-add",
  args: "[-f <Folder name to create>]",
  type: "reaction",
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return;

    const channel = message.channel;
    const GUILD_ID = message.guild.id;
    let folderName = "";
    let folder: { id: number | null; label: string } = { id: null, label: "" }
    let done = false;

    const finished = () => { done = true; }

    if (args.length && args[0] === "-f") {
      args.shift()
      folderName = args.join(" ")

      const folders = client.guildFolders.get(GUILD_ID) || [];

      if (folders.length)
        folder = folders.find(f => f.label.toLowerCase() === folderName.toLowerCase()) || { id: null, label: "" };

      if (folder.id !== null) {
        addFolder(GUILD_ID, folderName);
        // There should only be one Id per name...
        const ID = folderId(GUILD_ID, folderName);

        client.guildFolders.set(GUILD_ID, [...folders, { id: ID[0].id, label: folderName }]);

        folder = { id: ID[0].id, label: folderName };

        //@ts-ignore Not sure how to prove it's gonna be here, so take an ignore
        client.folderContents.set(folder.id, { id: folder.id, label: folder.label, guild_id: GUILD_ID, roles: [] })
      }
    }

    if (folderName !== "")
      await channel.send(`Setting up roles for Folder: \`${folderName}\``)
        .then(m => setTimeout(() => m.delete(), 10000))
        .catch(() => { });

    while (!done) {
      // Set to true, as by default we only want to read in one role.
      if (folderName === "")
        done = true;

      await reactSetup(channel as TextChannel, message, client, finished, folder.id).then(console.log).catch(console.error);
    }

    if (folderName !== "") {
      const FOLDERS = client.guildFolders.get(GUILD_ID);
      if (!FOLDERS) throw new Error("No folders exist for guild");
      const SIZE = FOLDERS.length
      channel.send(`Role folder \`${folderName}\` has been set up. Check it out by running \`@RoleBot folders -id ${SIZE - 1}\``)
        .then(m => setTimeout(() => m.delete(), 10000))
        .catch(() => { });
    }
  }
};

const reactSetup = (channel: TextChannel, message: Message, client: RoleBot, finished: Function, folderId: number | null) => {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    const GUILD_ID = message.guild.id;
    let id: string = "";
    const { guild } = message;
    if (!guild) throw new Error("Guild not found, possibly a group chat?");

    /* Let me clarify I am disgusted with the code below */
    channel
      .send("Enter the role name. If you want to stop, say `cancel` or `done`.")
      .then(bm => { 
        // Because I'm fighting callbacks and I'm stupid
        const emojiId = (i: string) => (id = i);

        channel
          .awaitMessages(m => m.author.id === message.author.id, {
            max: 1,
            time: 60000,
            errors: ["time"]
          })
          .then(m => {
            // Might as well cancel the whole process if they don't wanna do this
            const msg = m.first();
            if (!msg) throw new Error("Message somehow went missing");
            const content = msg.content.toLowerCase();

            if (
              m &&
              (content.includes("cancel") || content.includes("done")) &&
              bm instanceof Message
            ) {
              finished();
              bm.delete();
              msg.delete();
              return resolve("Cancelled");
            }

            const GUILD_REACT = guildReactions(guild.id);

            const role = guild.roles.find(
              r => r.name.toLowerCase() === content
            );

            if (!role && bm instanceof Message) {
              bm.edit("Role not found, check if you typed it correctly.");
              msg.delete();
              setTimeout(() => {
                bm.delete();
              }, 5000);
              return reject("Role not found");
            }

            if (
              role &&
              bm instanceof Message &&
              GUILD_REACT.find(r => r.role_id === role.id)
            ) {
              bm.edit(`Emoji already exist for this role`);
              setTimeout(() => {
                bm.delete().catch(() => { });
              }, 5000);
              msg.delete().catch(() => { });
              return reject("Emoji exist");
            }

            if (role && bm instanceof Message) {
              // They got the role they wanted. Now we need to get the emoji
              bm.edit(
                "Now send the emoji to match the role. This must be local to the server or a generic Discord emoji."
              );
              msg.delete().catch(() => { });

              channel
                .awaitMessages(m => m.author.id === message.author.id, {
                  max: 1,
                  time: 20000,
                  errors: ["time"]
                })
                .then(m => {
                  const msg = m.first()
                  if(!msg) throw new Error("Msg somehow gone")
                  // Some discord emojis don't have id's and just use the unicode. Weird
                  const match = /:(\d+)>/.exec(msg.content);


                  if (
                    m &&
                    (content.includes("cancel") || content.includes("done")) &&
                    bm instanceof Message
                  ) {
                    finished();
                    bm.delete().catch(() => { });
                    msg.delete().catch(() => { });
                    return resolve("Cancelled");
                  }

                  if (match) {
                    const [, id] = match;
                    if (!client.emojis.get(id)) {
                      bm.edit(
                        `Either not an emoji or it's not available to me. :(`
                      );
                      setTimeout(() => {
                        message.delete().catch(() => { });
                        bm.delete().catch(() => { });
                      }, 3000);
                      msg.delete();
                      return reject("Emoji not avail")
                    }

                    emojiId(id);
                  } else {
                    emojiId(msg.content);
                  }

                  if (role && id !== "") {
                    // Assuming everything went uh, great. Try to add. :))
                    addReactionRole(id, role.id, role.name, GUILD_ID, folderId);
                    if (folderId) {
                      const r: Role = { role_id: role.id, role_name: role.name, emoji_id: id}
                      const folder = client.folderContents.get(folderId)
                      if (!folder) throw new Error("Folder DNE, id must be incorrect");
                      client.folderContents.set(folder.id, { ...folder, roles: [...folder.roles, r] })
                    }

                    if (bm instanceof Message) {
                      msg.delete().catch(() => { });
                      setTimeout(() => {
                        bm.delete().catch(() => { });
                        message.delete().catch(() => { });
                      }, 3000);
                      resolve("Added role.")
                    }
                  }
                })
                .catch(() => {
                  if (bm instanceof Message) bm.edit("No usable emoji given.");
                  reject(finished());
                });
            }
          })
          .catch(() => {
            if (bm instanceof Message) bm.edit("You didn't send role name.");
            reject(finished());
          });
      });
  })
}
