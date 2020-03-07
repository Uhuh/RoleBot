import { Message, TextChannel } from "discord.js";
import { addReactionRole, guildReactions } from "../../src/setup_table";
import RoleBot from "../../src/bot";
import * as logger from "log-to-file";

export default {
  desc: "Associate an emoji with a role.",
  name: "-add",
  args: "{ Follow the prompts given }",
  type: "reaction",
  run: async (message: Message, _args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return;

    const channel = message.channel;
    let done = false;
    const finished = () => { done = true; }

    while (!done) {
      try {
        await reactSetup(channel as TextChannel, message, client, finished).then(console.log).catch(console.error);
      } catch(e) {
        logger(`Issue while creating reaction role: ${e}`, 'errors.log');
      }
    }
  }
};

const reactSetup = (channel: TextChannel, message: Message, client: RoleBot, finished: Function) => {
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

            const role = guild.roles.cache.find(
              r => r.name.toLowerCase() === content
            );

            if (!role && bm instanceof Message) {
              bm.edit("Role not found, check if you typed it correctly.");
              msg.delete();
              return reject("Role not found");
            }

            if (
              role &&
              bm instanceof Message &&
              GUILD_REACT.find(r => r.role_id === role.id)
            ) {
              bm.edit(`Emoji already exist for this role`);
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
                    if (!client.emojis.cache.get(id)) {
                      bm.edit(
                        `Either not an emoji or it's not available to me. :(`
                      );
                      setTimeout(() => {
                        message.delete().catch(() => { });
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
                    addReactionRole(id, role.id, role.name, GUILD_ID);

                    if (bm instanceof Message) {
                      msg.delete().catch(() => { });
                      setTimeout(() => {
                        bm.delete().catch(() => { });
                        message.delete().catch(() => { });
                      }, 100);
                      resolve("Added role.")
                    }
                  }
                })
                .catch((e) => {
                  if (bm instanceof Message) bm.edit("No usable emoji given.");
                  console.error(e);
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
