## Description
RoleBot's "prefix" is pinging the bot. I found prefixes with other bots to be annoying and auto-complete with tabbing is nice.

RoleBot handles "primary", "secondary", and "join" roles. "Primary" roles are the "main" role. RoleBot will 
only assign one primary role at any time per user. However "Secondary" roles can stack with primary and join roles.
Join roles are given when a user joins a guild. You **_CAN NOT_** have a join role be a primary/secondary at the same time. Vice versa.

Example usage of primary/secondary roles can be:

&nbsp;&nbsp;&nbsp;&nbsp;* Primary roles could grant display/color over secondary roles.

&nbsp;&nbsp;&nbsp;&nbsp;* Secondary roles could be roles that are pinged often. EG: `giveaways` `reading` `notifications` etc.

If you would like to invite my live bot here is the [link](https://discordapp.com/oauth2/authorize?client_id=493668628361904139&scope=bot&permissions=8). I am hosting it via Google Cloud Platform.

## Usage
**Fun Commands**
These commands are just for fun.

> @RoleBot tag

&nbsp;&nbsp;&nbsp;&nbsp;"Thinks" for a second then "tags" a random member in the guild.


**Role setup**
These commands are non destructable commands, they are meerly for making some things easier for mods.

> @RoleBot role \<prim | sec | join> \<Role name>

&nbsp;&nbsp;&nbsp;&nbsp;Description: Add a role to your hand out role list

&nbsp;&nbsp;&nbsp;&nbsp;prim = primary, it will replace any other primary role

&nbsp;&nbsp;&nbsp;&nbsp;sec = secondary and will stack with other secondary's and primaries

&nbsp;&nbsp;&nbsp;&nbsp;join = when a user joins the server they will be auto assigned this role

&nbsp;&nbsp;&nbsp;&nbsp;You cannot make a join role if the role is currently a prim/sec role and vice versa
  
> @RoleBot roleChannel \<channel mention>

&nbsp;&nbsp;&nbsp;&nbsp;Description: Makes a channel the role channel. Bot will prune messages and assign roles from this channel.

> @RoleBot deleteJoin \<role name>
  
&nbsp;&nbsp;&nbsp;&nbsp;Description: Remove a role from the join list.

> @RoleBot deleteRole \<role name>

&nbsp;&nbsp;&nbsp;&nbsp;Description: Delete a single role from your hand out roles list.

> @RoleBot removeChannel \<channel mention>

&nbsp;&nbsp;&nbsp;&nbsp;Description: Channel will no longer be pruned of messages and bot will not hand out roles from channel anymore.

> @RoleBot list 

&nbsp;&nbsp;&nbsp;&nbsp;Description: Retrives the list of roles that your server hands out.
