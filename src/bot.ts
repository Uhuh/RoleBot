import * as Discord from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();
import * as config from "./vars";
import msg from "../events/message";
import commandHandler from "../commands/commandHandler";
import joinRole from "../events/joinRoles";
import * as DBL from "dblapi.js";
import removed from "../events/removed";
import * as logger from "log-to-file";
import {
  getRoleByReaction,
  getReactMessages,
  getJoinRoles,
  guildFolders,
  folderContent
} from "./setup_table";
import { handle_packet } from "../events/raw_packet";

export interface Command {
  desc: string;
  args: string;
  name: string;
  type: string;
  run: Function;
}

export interface CommandCollection extends Command {
  commands: Discord.Collection<string, Command[]>;
}

export interface Role { 
  role_id: string; 
  role_name: string;
  emoji_id: string;
} 

export interface Folder { 
  id: number; 
  label: string;
  guild_id: string;
  roles: Role[] 
}

export default class RoleBot extends Discord.Client {
  config: any;
  reactMessage: string[];
  commands: Discord.Collection<string, Command>;
  commandsRun: number;
  reactChannel: Discord.Collection<string, Discord.Message>;
  guildFolders: Discord.Collection<string, { id: number; label: string; }[]>;
  folderContents: Discord.Collection<number, Folder>;
  joinRoles: Discord.Collection<string, { id: string; name: string }[]>;

  constructor() {
    super();
    this.config = config;
    this.commands = new Discord.Collection();
    this.reactMessage = [];
    this.commandsRun = 0;
    this.reactChannel = new Discord.Collection();
    this.guildFolders = new Discord.Collection<string,
      { id: number; label: string; }[]
    >();
    this.folderContents = new Discord.Collection<number, Folder>();
    this.joinRoles = new Discord.Collection<
      string,
      { id: string; name: string }[]
    >();

    commandHandler(this);
    /**
     * V12 is a pain and now we have to handle all the packets ourselves since nothing is cahced.
     * Fun. The bot is about roles so I better handle add/remove
     */
    this.on("raw", packet => handle_packet(packet, this));

    this.on("ready", (): void => {
      const dblapi = new DBL(this.config.DBLTOKEN, this);
      console.log(`[Started]: ${new Date()}`);
      if (this.config.DEV_MODE === "0")
        setInterval(() => dblapi.postStats(this.guilds.cache.size), 1800000);

      setInterval(() => this.randomPres(), 10000);
    });

    this.on("message", (message): void => msg(this, message as Discord.Message));
    this.on("guildMemberAdd", (member): void =>
      joinRole(member as Discord.GuildMember, this.joinRoles)
    );
    this.on("guildCreate", (guild): void => {
      
      // const G_ID = "567819334852804626"; - Support guild id
      const C_ID = "661410527309856827";
      const JOIN_MSG = "Thanks for the invite! Be aware that my role must be above the ones you want me to hand out to others.\nCheck out my commands by mentioning me.\nHere is my documentation: https://duwtgb.gitbook.io/rolebot/";

      // Send a DM to the user that invited the bot. If that breaks for some reason, dm the owner.
      guild.fetchAuditLogs()
        .then(audit => {
          const entry = audit.entries.first()

          if(!entry) return; // No throwing

          const { executor } = entry

          if(!executor) return;
          
          executor.send(JOIN_MSG)
        })
        .catch(e => {
          console.log(e)

          const owner = guild.owner || guild.members.cache.get(guild.ownerID);

          if(!owner) return;

          owner.send(JOIN_MSG);
        }).catch(e => logger(`Error trying to get bot adder: ${e}`, "errors.log"));

      const embed = new Discord.MessageEmbed();

      embed
        .setColor(3066993)
        .setTitle("**Joined Guild**")
        .setThumbnail(guild.iconURL() || "")
        .setDescription(guild.name)
        .addField("Member size:", guild.memberCount)
        .addField("Guilds:", this.guilds.cache.size)
        .addField("Guild ID:", guild.id);

      (this.channels.cache.get(C_ID) as Discord.TextChannel).send(
        embed
      );

      logger(
        `Joined - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`,
        "guilds.log"
      );

    });
    this.on("guildDelete", (guild): void => removed(guild, this));
    // React role handling
    this.on("messageReactionAdd", (reaction, user): void => {
      try {
        if (!reaction || user.bot) return;
        const { message } = reaction;
        if (this.reactMessage.includes(message.id) && message.guild) {
          const id = reaction.emoji.id || reaction.emoji.name;
          const emoji_role = getRoleByReaction(id, message.guild.id);
          // Remove reaction since it doesn't exist.
          if (!emoji_role) {
            reaction.users.remove(user.id).catch(console.error);
            return;
          }
          const { role_id } = emoji_role;

          const role = message.guild.roles.cache.get(role_id);
          let member = message.guild.members.cache.get(user.id);

          if(!member) {
            console.log(`Role add - Failed to get member from cache. Going to fetch and retry....`);
            message.guild.members.fetch(user.id);
            member = message.guild.members.cache.get(user.id);
          }
          
          if(!role) throw new Error(`Role DNE`);
          if(!member) throw new Error(`Member not found: ${user.username} - ${user.id}`);

          member.roles.add(role).catch(console.log);
          return;
        }

        return;
      } catch(e) {
        logger(`Error occured trying to add react-role: ${e}`, "errors.log")
      }
    });

    this.on("messageReactionRemove", (reaction, user): void => {
      try {
        if (!reaction || user.bot) return;
        const { message } = reaction;
        if (this.reactMessage.includes(message.id) && message.guild) {
          const id = reaction.emoji.id || reaction.emoji.name;
          const emoji_role = getRoleByReaction(id, message.guild.id);
          // Just for bot to not die
          if(!emoji_role) return;
          
          const { role_id } = emoji_role;
          
          if (!role_id) return;
          const role = message.guild.roles.cache.get(role_id);
          let member = message.guild.members.cache.get(user.id);

          if(!member) {
            console.log(`Role remove - Failed to get member from cache. Going to fetch and retry....`);
            message.guild.members.fetch(user.id);
            member = message.guild.members.cache.get(user.id);
          }

          if(!role) throw new Error("Role DNE");
          if(!member) throw new Error(`Member not found: ${user.username} - ${user.id}`);
          member.roles.remove(role).catch(console.error);
        }
      } catch(e) {
        logger(`Error occured trying to remove react-role: ${e}`, "errors.log");
      }
    });
  }

  randomPres = (): void => {
    const user = this.user;
    if (!user) return console.log("Client dead?");

    const presArr = [
      `@${user.username} help`,
      `in ${this.guilds.cache.size} guilds`,
      `roles.`
    ];

    user
      .setPresence({
        activity: { name: presArr[Math.floor(Math.random() * presArr.length)], type: "STREAMING", url: "https://www.twitch.tv/rolebot" },
        status: "online"
      })
      .catch(console.error);
  };

  /**
   * Hmm, the issue currently is being limited by Discords API
   * Need to find out how clear guilds messages by bot vs custom.
   * Maybe a new system is in place
   */
  async loadReactMessage(): Promise<void> {
    const rows = getReactMessages();

    for(const r of rows) {
      const M_ID = r.message_id;
      this.reactMessage.push(M_ID);
    }

    console.log(this.reactMessage)
  }

  /**
   * I might kill this role system off.
   */
  async loadRoles(): Promise<void> {
    const GUILD_IDS = this.guilds.cache.keys();

    for (const g_id of GUILD_IDS) {
      const joinRoles = getJoinRoles(g_id);

      for (const r of joinRoles) {
        const join_roles = this.joinRoles.get(g_id) || [];
        this.joinRoles.set(g_id, [
          ...join_roles,
          { name: r.role_name, id: r.role_id }
        ]);
      }
    }
  }

  async loadFolders(): Promise<void> {
    this.guilds.cache.forEach(g => {
      const FOLDERS = guildFolders(g.id);
      this.guildFolders.set(g.id, FOLDERS);
      FOLDERS.map(f => {
        const roles = folderContent(f.id);
        let r = roles.map(r => ({ role_id: r.role_id, role_name: r.role_name, emoji_id: r.emoji_id }));

        if (r.length === 1 && r[0].role_id === null) r = []

        this.folderContents.set(f.id, { id: f.id, label: f.label, guild_id: g.id, roles: r });
      })
    })
  }

  async start() {
    await this.login(this.config.TOKEN);
    await this.loadRoles();
    await this.loadFolders();
    await this.loadReactMessage();
  }
}
