## Description

If you would like to invite my live bot here is the [link](https://discordapp.com/oauth2/authorize?client_id=342815158688808961&scope=bot&permissions=8). I am hosting it via Google Cloud Platform.

## Usage
**Fun Commands** <br>
These commands are just for fun.

> modpls dog <br>

&nbsp;&nbsp;&nbsp;&nbsp;Returns a photo or gif of a random dog.


**Helper Commands** <br>
These commands are non destructable commands, they are meerly for making some things easier for mods.

> modpls setname \<user mention> \<name here> <br>
  
&nbsp;&nbsp;&nbsp;&nbsp;Sets a users _"name"_ to a custom name.<br>
> modpls whois \<user mention> <br>
  
&nbsp;&nbsp;&nbsp;&nbsp;Outputs the users name if set. <br>
> modpls ping
  
&nbsp;&nbsp;&nbsp;&nbsp;Returns the bots ping.
  
  
**Moderation Commands** <br>
These commands **_can_** be desctructable. Some require roles to use and these help manage the server.

> modpls activity <# to see> <br>
  
&nbsp;&nbsp;&nbsp;&nbsp;Outputs # of people that have least activity. 25 is the max you can request. <br>
> modpls kick \<user mention(s)> \<reason(optional)> <br>
  
&nbsp;&nbsp;&nbsp;&nbsp;Kicks user(s) and audit logs the reason if given. Only those with `KICK_MEMBERS` permissions can use this. <br>
> modpls purge \<message amount> \<user mention(optional)> <br>

&nbsp;&nbsp;&nbsp;&nbsp;Deletes messages in the channel you request it in, delete user specific commands if user is mentioned. Only users with `MESSAGE_MANAGE` can use this command.

> modpls ban  <user mention(s)> <number of days(default 7 days)> <reason(optional)>

&nbsp;&nbsp;&nbsp;&nbsp;Bans a user for X amount of days. Only users with `BAN_MEMBERS` can use this command.

> modpls status

&nbsp;&nbsp;&nbsp;&nbsp;Outputs server information, such as users in server, owner, amount of text/voice channels etc.

> modpls botstatus

&nbsp;&nbsp;&nbsp;&nbsp;Outputs the bots information.

> modpls lock <number of minute(s)> <#channel-name(s)>

&nbsp;&nbsp;&nbsp;&nbsp;Users will not be able to send messages to locked channels. Only users with `MANAGE_CHANNELS` can use this command.

> modpls prefix <custom prefix>

&nbsp;&nbsp;&nbsp;&nbsp;You can change the prefix of the bot for your guild. Only users with `MANAGE_GUILD` can use this command.

## Contributors

- [Dylan Warren](https://github.com/Uhuh)

## License

MIT
