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

interface Command {
  desc: string
  args: string
  name: string
  run: Function
}

export default class RoleBot extends Discord.Client {
  config: any
  commands: Discord.Collection<string, Command>

  constructor() {
    super()
    this.config = config
    this.commands = new Discord.Collection()

    commandHandler(this)
    this.on("ready", () => {
      const dblapi = new DBL(this.config.DBLTOKEN, this)
      console.log(`[Started]: ${new Date()}`)
      if (this.config.DEV_MODE === "0") setInterval(() => dblapi.postStats(this.guilds.size), 1800000)
      setInterval(() => this.presence(), 10000)
    })

    this.on("message", message => msg(this, message))
    this.on("guildMemberAdd", member => joinRole(member))
    this.on("roleUpdate", (_oldRole, newRole) => roleUpdate(newRole))
    this.on("guildCreate", guild => logger(`Joined - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`, 'guilds.log'))
    this.on("guildDelete", guild => removed(guild))
	this.on("messageReactionAdd", () => console.log('added'))
	this.on("messageReactionRemove", () => console.log('removed'))
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

  loadJoinMessages() {
  	// need channelId, messageId from DB
	// channel.fetchMessage
  }

  async start() {
    await this.login(this.config.TOKEN)
  }
}
