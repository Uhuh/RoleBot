import * as Discord from "discord.js"
import * as dotenv from "dotenv"

dotenv.config()
import * as config from "./vars"
import msg from "../events/message"
import commandHandler from "../commands/commandHandler"
import joinRole from "../events/joinRoles"
import roleUpdate from "../events/roleUpdate"
import * as DBL from 'dblapi.js'
import removed from "../events/removed"
import * as logger from "log-to-file";
import {getRoleByReaction, getReactMessages, getRoles, getJoinRoles, getChannel} from './setup_table'

interface Command {
  desc: string
  args: string
  name: string
  run: Function
}

export default class RoleBot extends Discord.Client {
  config: any
  commands: Discord.Collection<string, Command>
  reactMessage: Discord.Collection<string, Discord.Message>
  reactChannel: Discord.Collection<string, Discord.Message>
  roleChannels: Discord.Collection<string, string>
  primaryRoles: Discord.Collection<string, {id: string, name: string}[]>
  secondaryRoles: Discord.Collection<string, {id: string, name: string}[]>
  joinRoles: Discord.Collection<string, {id: string, name: string}[]>

  constructor() {
    super()
    this.config = config
    this.commands = new Discord.Collection()
    this.reactMessage = new Discord.Collection<string, Discord.Message>()
    this.reactChannel = new Discord.Collection()
    this.roleChannels = new Discord.Collection<string, string>()
    this.primaryRoles = new Discord.Collection<string, {id: string, name: string}[]>()
    this.secondaryRoles = new Discord.Collection<string, {id: string, name: string}[]>()
    this.joinRoles = new Discord.Collection<string, {id: string, name: string}[]>()

    commandHandler(this)
    
    this.on("ready", () => {
      const dblapi = new DBL(this.config.DBLTOKEN, this)
      console.log(`[Started]: ${new Date()}`)
      if (this.config.DEV_MODE === "0") setInterval(() => dblapi.postStats(this.guilds.size), 1800000)
      setInterval(() => this.presence(), 10000)
    })

    this.on("message", message => msg(this, message))
    this.on("guildMemberAdd", member => joinRole(member, this.joinRoles))
    this.on("roleUpdate", (_oldRole, newRole) => roleUpdate(newRole))
    this.on("guildCreate", guild => logger(`Joined - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`, 'guilds.log'))
    this.on("guildDelete", guild => removed(guild))
    // React role handling
    this.on("messageReactionAdd", async (reaction, user) => {
      if (!reaction || user.bot) return
      const message = reaction.message
      if (this.reactMessage.has(message.id)) {
        const id = reaction.emoji.id || reaction.emoji.name
        const [{role_id}] = (await getRoleByReaction(id))
        const role = message.guild.roles.get(role_id)!
        const member = message.guild.members.get(user.id)!
        member.addRole(role)
      }
    })
    this.on("messageReactionRemove", async (reaction, user) => {
      if (!reaction || user.bot) return
      const message = reaction.message
      if (this.reactMessage.has(message.id)) {
        const id = reaction.emoji.id || reaction.emoji.name
        const [{role_id}] = (await getRoleByReaction(id))
        const role = message.guild.roles.get(role_id)!
        const member = message.guild.members.get(user.id)!
        member.removeRole(role)
      }
    })
  }

  presence() {
    const presArr = [
      `@${this.user.username} help`,
      `in ${this.guilds.size} guilds`,
      `with ${Math.floor(this.ping)} ping`
    ]

    this.user.setPresence({
      game: {name: presArr[Math.floor(Math.random() * presArr.length)]},
      status: "online"
    })
  }

  async loadReactMessage() {
    const rows = await getReactMessages();
    //const messages = await Promise.all(rows.map(({guild_id, message_id, channel_id}) => (this.guilds.get(guild_id)!.channels.get(channel_id)! as Discord.TextChannel).fetchMessage(message_id)));
    
    rows.forEach(async(r) => {
      const guild = await this.guilds.get(r.guild_id)
      const channel = await guild!.channels.get(r.channel_id) as Discord.TextChannel
      const msg = await channel.fetchMessage(r.message_id)

      this.reactMessage.set(msg.id, msg)
    })
  }

  loadRoles() {
    const GUILD_IDS = this.guilds.map(g => g.id);

    for (const g_id of GUILD_IDS) {
      const roles = getRoles(g_id);
      const joinRoles = getJoinRoles(g_id);

      for(const r of roles) {
        
        if (r.prim_role) {
          const guild_roles = this.primaryRoles.get(g_id) || []
          this.primaryRoles.set(g_id, [...guild_roles, {name: r.role_name, id: r.role_id}])
        } else {
          const guild_roles = this.secondaryRoles.get(g_id) || []
          this.secondaryRoles.set(g_id, [...guild_roles, {name: r.role_name, id: r.role_id}])
        }
      }

      for (const r of joinRoles) {
        const join_roles = this.joinRoles.get(g_id) || []
        this.joinRoles.set(g_id, [...join_roles, {name: r.role_name, id: r.role_id}])
      }

      this.roleChannels.set(g_id, getChannel(g_id)[0].channel_id)
    }
  }

  async start() {
    await this.login(this.config.TOKEN);
    await this.loadReactMessage();
    await this.loadRoles()
    this.user.setPresence({
      game: {name: "with stupid roles."},
      status: "online"
    })
  }
}
