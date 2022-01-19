# What does RoleBot do?
RoleBot is a [Discord](https://discord.com/) application solely focused on creating "Reaction Roles" in servers.

It achieves this by lettings users use the _carefully_ crafted commands here to create an association between a Discord role and emoji. 

![](https://media.discordapp.net/attachments/672912829032169474/928504207651242084/unknown.png)

The users are also encouraged to put their newly made _react roles_ into a _"category"_. This helps the user and the bot break up all the react roles that the user creates and makes it easier to manage.  
> For **example** you might want to create a collection of roles, maybe some "color" roles. So you create a "color" category and add all the color related react roles to it.
> ![](https://media.discordapp.net/attachments/672912829032169474/928504678621282344/unknown.png)

That's the TLDR; for RoleBot! Using it is super simple! But the code behind it to make sure it all works is a little lengthy. And now hopefully pretty after this rewrite.

# Environment stuff.
Since this bot is using `discord.js v.13.3` we need to use `node >16`.

The `.env` file should follow this..
```.env
TOKEN=your super secret token goes here
DB_NAME=postgres db name
POSTGRES_URL=postgres://username:password@ip:5432/
# Set to 1 if you're working in a dev environment.
SYNC_DB=0
```

# Why the rewrite?
I made this bot forever ago in ~2017 where I made some super goofy solution for a single server where there was this horrible "primary" "secondary" role system. Worked great for some but god it was confusing.

After awhile people really wanted reaction roles, that was implemented.. poorly.

Now in 2022 around April Discord is enforcing most bots to use their new crappy slash command system so now I find myself updating this bot to try and keep it alive as it's in >1500 servers.

> However, I lost access to my original account to which the original RoleBot belongs to, yet I have the token to keep it alive and hosted.

So now I do this rewrite in hopes to replace the existing RoleBot with much much better code.