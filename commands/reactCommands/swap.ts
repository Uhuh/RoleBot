import { Message } from "discord.js";
import { reactionById, giveFolderId } from "../../src/setup_table";
import RoleBot from "../../src/bot";
import { IReactionRole, IFolderReactEmoji } from "../../src/interfaces";

export default {
  desc: "Swap two roles positions.\nExample `rb reaction swap Xbox | PS4`",
  name: "swap",
  args: "<Name> | <Name>",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return;

    const roleNames = args.join(' ').split('|').map(l => l.trim().toLowerCase());
  
    if(roleNames.length > 2) {
      return message.channel.send('Too many role names given. Only give two when running the command. Example `rb reaction swap Xbox | PS4`');
    } else if(roleNames.length !== 2) {   
      return message.channel.send('Not enough roles given. Try again, example `rb reaction swap Xbox | PS4`');
    }

    const roles = message.guild.roles.cache.filter(r => roleNames.includes(r.name.toLowerCase()));

    if(roles.size !== 2) {
      const role = roles.first();
      if(!role) return message.channel.send('No roles found. Check for typos.');

      return message.channel.send(`Could only find \`${role.name}\`. Check for typos for the other.`);
    }

    const reactionRoles = [];

    for(const [, r] of roles) {
      const reactionRole = reactionById(r.id);
      if(reactionRole) {
        reactionRoles.push(reactionRole);
      }
    }

    if(reactionRoles[0].folder_id && reactionRoles[1].folder_id) {
      const folder = client.folderContents.get(Number(reactionRoles[0].folder_id));
      const secFolder = client.folderContents.get(Number(reactionRoles[1].folder_id));
      if(!folder || !secFolder) {
        return console.error('Unable to swap roles as folder DNE');
      }
      const role = reactionRoles[0];
      const secRole = reactionRoles[1];

      roleFolderSwap(folder, secFolder, role);
      roleFolderSwap(secFolder, folder, secRole);

    } else {
      nullFolderHandle(client, reactionRoles);
      nullFolderHandle(client, reactionRoles, true);
    }

    return message.react("✅");
  }
};

/**
 * Transfer role from current folder to new one.
 * @param currFolder The folder that role is currently in.
 * @param newFolder The folder to place the role into/
 * @param role Role that's being moved
 */
const roleFolderSwap = (
  currFolder: IFolderReactEmoji, 
  newFolder: IFolderReactEmoji, 
  role: IReactionRole
) => {
  
  const removeRole = currFolder.roles.find(r => r.role_id === role.role_id);
  if(!removeRole) {
    return console.error(`${role.role_name} : Couldn't find role in ${currFolder.label}.`);
  }
  currFolder.roles.splice(currFolder.roles.indexOf(removeRole), 1);

  newFolder.roles = [
    ...newFolder.roles, 
    {
      emoji_id: role.emoji_id, 
      role_id: role.role_id, 
      role_name: role.role_name
    }
  ];

  giveFolderId(role.role_id, newFolder.id);
}

/**
 * Some roles aren't in folders. Use this to transfer into a folder and make one free
 * @param client Bot instance
 * @param roles The two roles to be swapped.
 * @param reverse To swap both properly you run function twice. (Until I clean this up lol)
 */
const nullFolderHandle = (client: RoleBot, roles: IReactionRole[], reverse = false) => {
  const [start, end] = reverse ? [1, 0] : [0, 1];

  if(roles[start].folder_id === roles[end].folder_id) {
    return;
  }

  if(!roles[start].folder_id && roles[end].folder_id) {
    const folder = client.folderContents.get(Number(roles[end].folder_id));
    if(!folder) {
      return console.log('Unable to swap roles as folder DNE');
    }
    const role = folder.roles.find(r => r.role_id === roles[end].role_id);
    if(!role) {
      return console.error(`Couldn't find role ${roles[end]}`);
    }
    folder.roles.splice(folder.roles.indexOf(role), 1);

    giveFolderId(role.role_id, null);

  } else if (roles[start].folder_id && !roles[end].folder_id) {
    const folder = client.folderContents.get(Number(roles[start].folder_id));
    if(!folder) {
      return console.error('Unable to swap roles as folder DNE');
    }
    const role = roles[end];

    folder.roles = [
      ...folder.roles, 
      {
        emoji_id: role.emoji_id, 
        role_id: role.role_id, 
        role_name: role.role_name
      }
    ];
    giveFolderId(role.role_id, folder.id);
  }
}