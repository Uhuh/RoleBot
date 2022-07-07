# Check out Rolebots [site](https://rolebot.gg)

# Want to self host?
**Don't trust me? You can self host RoleBot yourself.**

## Hosting environment.
It is ***ideal that you do this in a linux environment.*** You can run this bot just fine in Windows Subsystem for Linux (WSL). This is what I use. If you want to install this go [here](https://docs.microsoft.com/en-us/windows/wsl/install).

**For the sake of this "guide" I am setting up in a debian (Ubuntu/WSL) enviroment for [yarn](https://classic.yarnpkg.com/lang/en/docs/install) and [nvm](https://github.com/nvm-sh/nvm).**

## Install nvm
To install `nvm` you need to use `curl`, incase you don't have `curl` installed here's the command to install
> `sudo apt install curl`

Now install nvm
> `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`

Now you need to logout and login again to load the `nvm` environment correctly, or you can run this command to do the same.
> `source ~/.profile`

Now confirm it was installed correctly with
> `nvm --version`

## Use nvm to install node/npm

Since this version of the bot at time of writing uses `discord.js@13.X` we're required to use `node@16` minimum. So let's install `node@16` with nvm and set the default version to 16.
> `nvm install 16 && nvm alias default 16`

## Install yarn with npm
Now let's install `yarn` globally.
> `npm install --global yarn`

## **Your environment should be good to go from here**
If you don't have `git` installed do this..
> `sudo apt install git`

Now that we have `git` installed let's clone down the repo, change directory, and install our dependecies.
> `git clone https://github.com/Uhuh/RoleBot.git`

> `cd RoleBot`

> `yarn install`

Great! We should have our dependencies installed. Now let's update some tokens so we can turn the bot on.

I use `dotenv` and have an example .env in this repo [here](https://github.com/Uhuh/RoleBot/blob/master/.env.example). You can copy it and make a new file `.env`
```.env
TOKEN=your super_secret_bot_token
DB_NAME=postgres_db_name
POSTGRES_URL=postgres://username:password@ip:5432/
# Set to 1 if you're working in a dev environment.
SYNC_DB=0
```
> Don't want to use dotenv? Update the variables in `src/vars.ts` instead.

**After setting this all up you should be able to run `yarn start`**

# What does RoleBot do?
RoleBot is a [Discord](https://discord.com/) application solely focused on creating "Reaction Roles" in servers.

It achieves this by lettings users use the _carefully_ crafted commands here to create an association between a Discord role and emoji. 

![](https://media.discordapp.net/attachments/672912829032169474/928504207651242084/unknown.png)

The users are also encouraged to put their newly made _react roles_ into a _"category"_. This helps the user and the bot break up all the react roles that the user creates and makes it easier to manage.  
> For **example** you might want to create a collection of roles, maybe some "color" roles. So you create a "color" category and add all the color related react roles to it.
> ![](https://media.discordapp.net/attachments/672912829032169474/928504678621282344/unknown.png)

That's the TLDR; for RoleBot! Using it is super simple! But the code behind it to make sure it all works is a little lengthy. And now hopefully pretty after this rewrite.