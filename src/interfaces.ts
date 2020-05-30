export interface IReactionRole {
  folder_id: string;
  guild_id: string;
  emoji_id: string;
  role_id: string;
  role_name: string;
  id: string; 
};

export interface IRole {
  id: string;
  role_name: string;
  guild: string;
  role_id: string;
};

export interface IReactMessage {
  message_id: string;
  channel_id: string;
  guild_id: string;
};

export interface IFolder {
  id: number;
  guild_id: string;
  label: string;
};

export interface IFolderReactEmoji extends IFolder {
  roles: IRoleEmoji[];
}

export interface IRoleEmoji {
  role_id: string;
  role_name: string;
  emoji_id: string;
}

export interface IRoleChannel {
  id: string;
  channel_id: string;
  guild: string; // guild_id
  message_id: string;
};

export interface IJoinRole {
  id: string;
  role_name: string;
  role_id: string;
  guild_id: string;
};