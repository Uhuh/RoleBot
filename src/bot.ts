import * as Discord from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();
import * as config from "./vars";
import msg from "../events/message";
import commandHandler from "../commands/commandHandler";
import joinRole from "../events/joinRoles";
import roleUpdate from "../events/roleUpdate";
import * as DBL from "dblapi.js";
import removed from "../events/removed";
import * as logger from "log-to-file";
import {
  getRoleByReaction,
  getReactMessages,
  getRoles,
  getJoinRoles,
  getChannel
} from "./setup_table";

interface Command {
  desc: string;
  args: string;
  name: string;
  type: string;
  run: Function;
}

export default class RoleBot extends Discord.Client {
  config: any;
  commands: Discord.Collection<string, Command>;
  reactMessage: Discord.Collection<string, Discord.Message>;
  reactChannel: Discord.Collection<string, Discord.Message>;
  roleChannels: Discord.Collection<string, string>;
  primaryRoles: Discord.Collection<string, { id: string; name: string }[]>;
  secondaryRoles: Discord.Collection<string, { id: string; name: string }[]>;
  joinRoles: Discord.Collection<string, { id: string; name: string }[]>;

  constructor() {
    super();
    this.config = config;
    this.commands = new Discord.Collection();
    this.reactMessage = new Discord.Collection<string, Discord.Message>();
    this.reactChannel = new Discord.Collection();
    this.roleChannels = new Discord.Collection<string, string>();
    this.primaryRoles = new Discord.Collection<
      string,
      { id: string; name: string }[]
    >();
    this.secondaryRoles = new Discord.Collection<
      string,
      { id: string; name: string }[]
    >();
    this.joinRoles = new Discord.Collection<
      string,
      { id: string; name: string }[]
    >();

    commandHandler(this);

    this.on("ready", () => {
      const dblapi = new DBL(this.config.DBLTOKEN, this);
      console.log(`[Started]: ${new Date()}`);
      if (this.config.DEV_MODE === "0")
        setInterval(() => dblapi.postStats(this.guilds.size), 1800000);

      setInterval(() => this.randomPres(), 10000);
    });

    this.on("message", message => msg(this, message as Discord.Message));
    this.on("guildMemberAdd", member =>
      joinRole(member as Discord.GuildMember, this.joinRoles)
    );
    this.on("roleUpdate", (_oldRole, newRole) => roleUpdate(newRole));
    this.on("guildCreate", guild => {
      // const G_ID = "567819334852804626"; - Support guild id
      const C_ID = "661410527309856827";
      const JOIN_MSG = "Thanks for the invite! Be aware that my role must be above the ones you want me to hand out to others.\nCheck out my commands by mentioning me."

      // Send a DM to the user that invited the bot. If that breaks for some reason, dm the owner.
      guild.fetchAuditLogs()
        .then(audit => {
          const {executor} = audit.entries.first()!

          executor.send(JOIN_MSG)
        })
        .catch(e => {
          console.log(e)

          const owner = guild.owner || guild.members.get(guild.ownerID)!;

          owner.send(JOIN_MSG);
        })

      const embed = new Discord.MessageEmbed();

      embed
        .setColor(3066993)
        .setTitle("**Joined Guild**")
        .setThumbnail(guild.iconURL() || "")
        .setDescription(guild.name)
        .addField("Member size:", guild.memberCount)
        .addField("Guilds:", this.guilds.size);

      (this.channels.get(C_ID) as Discord.TextChannel).send(
        embed
      );

      logger(
        `Joined - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`,
        "guilds.log"
      );

    });
    this.on("guildDelete", guild => removed(guild, this));
    // React role handling
    //@ts-ignore - all paths don't return
    this.on("messageReactionAdd", async (reaction, user) => {
      if (!reaction || user.bot) return;
      const {message} = reaction;
      if (this.reactMessage.has(message.id) && message.guild) {
        const id = reaction.emoji.id || reaction.emoji.name;
        const emoji_role = getRoleByReaction(id, message.guild.id);
        
        const [{ role_id }] = emoji_role.length
        ? emoji_role
        : [{ role_id: null }];
        
        if (!role_id) {
          return reaction.users.remove(user.id).catch(console.error);
        }

        const role = message.guild.roles.get(role_id)!;
        const member = message.guild.members.get(user.id)!;
        member.roles.add(role).catch(console.log);
      }
    });
    this.on("messageReactionRemove", async (reaction, user) => {
      if (!reaction || user.bot) return;
      const {message} = reaction;
      if (this.reactMessage.has(message.id) && message.guild) {
        const id = reaction.emoji.id || reaction.emoji.name;
        const emoji_role = getRoleByReaction(id, message.guild.id);
        const [{ role_id }] = emoji_role.length
          ? emoji_role
          : [{ role_id: null }];
        // cancel
        if (!role_id) return;
        const role = message.guild.roles.get(role_id)!;
        const member = message.guild.members.get(user.id)!;
        member.roles.remove(role).catch(console.error);
      }
    });
  }

  randomPres = () => {
    const user = this.user;
    if (!user) return console.log("Client dead?");

    const presArr = [
      `@${user.username} help`,
      `in ${this.guilds.size} guilds`,
      ` roles.`
    ];

    user
      .setPresence({
        activity: { name: presArr[Math.floor(Math.random() * presArr.length)], type: "STREAMING", url:"https://www.twitch.tv/rolebot" },
        status: "online"
      })
      .catch(console.error);
  };

  async loadReactMessage() {
    const rows = getReactMessages();

    rows.forEach(async r => {
      const C_ID = r.channel_id;
      const M_ID = r.message_id;

      const channel = await this.channels.fetch(C_ID).catch(() => console.error(`Either no access or deleted channel: ${C_ID}`));

      if (!channel) return;

      const msg = await (channel as Discord.TextChannel).messages
        .fetch(M_ID)
        .catch(() => console.error(`M_ID: ${M_ID} not found.`));

      if (!msg) return;

      this.reactMessage.set(msg.id, msg);
    });
  }

  async loadRoles() {
    const GUILD_IDS = this.guilds.map(g => g.id);

    for (const g_id of GUILD_IDS) {
      const roles = getRoles(g_id);
      const joinRoles = getJoinRoles(g_id);

      for (const r of roles) {
        if (r.prim_role) {
          const guild_roles = this.primaryRoles.get(g_id) || [];
          this.primaryRoles.set(g_id, [
            ...guild_roles,
            { name: r.role_name, id: r.role_id }
          ]);
        } else {
          const guild_roles = this.secondaryRoles.get(g_id) || [];
          this.secondaryRoles.set(g_id, [
            ...guild_roles,
            { name: r.role_name, id: r.role_id }
          ]);
        }
      }

      for (const r of joinRoles) {
        const join_roles = this.joinRoles.get(g_id) || [];
        this.joinRoles.set(g_id, [
          ...join_roles,
          { name: r.role_name, id: r.role_id }
        ]);
      }

      this.roleChannels.set(
        g_id,
        getChannel(g_id).length ? getChannel(g_id)[0].channel_id : null
      );
    }
  }

  async start() {
    await this.login(this.config.TOKEN);
    await this.loadReactMessage();
    await this.loadRoles();
  }
}
