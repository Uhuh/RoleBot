import * as Discord from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();
import * as config from "./vars";
import msg from "../events/message";
import commandHandler from "../commands/commandHandler";

interface Command {
  name: string;
  run: Function;
}

export default class RoleBot extends Discord.Client {
  config: any;
  commands: Discord.Collection<string, Command>;
  constructor() {
    super();
    this.config = config;
    this.commands = new Discord.Collection();

    commandHandler(this);
    this.on("ready", () => {
      console.log(`[Started]: ${new Date()}`);
      this.user.setUsername("RoleBot");
    });

    this.on("message", message => {
      msg(this, message);
    });
  }

  async start() {
    await this.login(this.config.TOKEN);
  }
}
