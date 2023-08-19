![rolebotbannner](https://media.discordapp.net/attachments/1043396635696308325/1043429994631807016/rolebot-gitbanner.png?width=1179&height=663)

# Check out RoleBots [Site](https://rolebot.gg)

# Checkout RoleBots [Discord support server](https://discord.gg/U9WSVZfMUW)

# RoleBot Selfhosting

## RoleBot is available to be selfhosted! This is a guide on how to do so.

# Requirements

- [Node.js](https://nodejs.org/en/) (v17.00 or newer)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Curl](https://curl.se/download.html)

---
<br>

# Hosting environment.

It is ideal that you do this in a linux environment. You can run this bot just fine in Windows Subsystem for Linux (
WSL). This is what I use. If you want to install this go [here](https://docs.microsoft.com/en-us/windows/wsl/install).

**For the sake of this "guide" I am setting up in a debian (Ubuntu/WSL) enviroment
for [yarn](https://classic.yarnpkg.com/lang/en/docs/install) and [nvm](https://github.com/nvm-sh/nvm).**

# Install nvm (Node Verson Manager)

To install `nvm` you need to use `curl`, incase you don't have `curl` installed here's the command to install

```
$  sudo apt install curl
```

---

# Now install nvm

```
 $  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`
 ```

Now you need to logout and login again to load the `nvm` environment correctly, or you can run this command to do the
same.

```
$  source ~/.profile
```

# Now confirm it was installed correctly with

```
$  nvm --version
```

---

## Use nvm to install node/npm

Since this version of the bot at time of writing uses `discord.js@14.X` we're required to use `node@18` minimum. So
let's install `node@18` with nvm and set the default version to 18.

```
$  nvm install 18 && nvm alias default 18
```

---

# Install yarn with npm

Now let's install `yarn` globally.

```
npm install --global yarn`
```

---

## **Your environment should be good to go from here**

If you don't have `git` installed do this..

```
$  sudo apt install git
```

Now that we have `git` installed let's clone down the repo, change directory, and install our dependecies.

```
$  git clone https://github.com/Uhuh/RoleBot.git

$  cd RoleBot

$  yarn install
```

---

# Great! We should have our dependencies installed. Now let's update some tokens so we can turn the bot on.

I use `dotenv` and have an example .env in this repo [here](https://github.com/Uhuh/RoleBot/blob/master/.env.example).
You can copy it and make a new file `.env` - **You should never share your .env with annybody, it contains sensitive
information.**

```
TOKEN=your_super_secret_bot_token

DB_NAME=postgres_db_name

POSTGRES_URL=postgres://username:password@ip:5432/

# ↓ Set to 1 if you're working in a dev environment. 

SYNC_DB=0

WEBHOOK_ID=webhook_id
WEBHOOK_TOKEN=webhook_token
CLIENT_ID=the_bots_id
SHARD_COUNT=1

```

### Don't want to use dotenv? Update the variables in `src/vars.ts` instead.

---

### **After setting this all up you should be able to run `yarn start`**

## If you experince any issues please join the [support server](https://discord.gg/U9WSVZfMUW) and ask for help!

---
<br>
<br>

# What does RoleBot do?

RoleBot is a [Discord](https://discord.com/) application solely focused on creating "Reaction Roles" in servers.

It achieves this by lettings users use the _carefully_ crafted commands here to create an association between a Discord
role and emoji.

![](https://media.discordapp.net/attachments/1043396635696308325/1043439564695552000/rolebot-rounded.png)

The users are also encouraged to put their newly made _react roles_ into a _"category"_. This helps the user and the bot
break up all the react roles that the user creates and makes it easier to manage.

---

For **example** you might want to create a collection of roles, maybe some "color" roles. So you create a "color"
category and add all the color related react roles to it.

---

![](https://media.discordapp.net/attachments/1043396635696308325/1043440595147968603/rolebot-catlistrounded.png)

That's the TLDR; for RoleBot! Using it is super simple! But the code behind it to make sure it all works is a little
lengthy. And now hopefully pretty after this rewrite.
