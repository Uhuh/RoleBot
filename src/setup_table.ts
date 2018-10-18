import bowsette from "./bot";
import * as SQLite from 'better-sqlite3'

const sql = new SQLite('./roles.sqlite')

export default (client: bowsette) => {
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'roles';").get()
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare('CREATE TABLE roles (id TEXT PRIMARY KEY, role_name TEXT, prim_role INT, guild TEXT, role_id TEXT);').run()
    // Ensure that the 'id' row is always unique and indexed.
    sql.prepare('CREATE UNIQUE INDEX idx_roles_id ON roles (id);').run()
    sql.pragma('synchronous = 1')
    sql.pragma('journal_mode = wal')
  }
  const roleChanneltable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'role_channel';").get()
  if (!roleChanneltable['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare('CREATE TABLE role_channel (id TEXT PRIMARY KEY, channel_id TEXT, guild TEXT);').run()
    // Ensure that the 'id' row is always unique and indexed.
    sql.prepare('CREATE UNIQUE INDEX idx_channel_id ON roles (id);').run()
    sql.pragma('synchronous = 1')
    sql.pragma('journal_mode = wal')
  }
  client.deleteRoles = sql.prepare("DELETE FROM roles WHERE guild = ?")
  client.getChannel = sql.prepare("SELECT * FROM role_channel WHERE guild = ? AND channel_id = ?")
  client.removeChannel = sql.prepare("DELETE FROM role_channel WHERE id = ? AND channel_id = ?")
  client.addChannel = sql.prepare("INSERT OR REPLACE INTO role_channel (id, channel_id, guild) VALUES (@id, @channel_id, @guild);")
  client.addRole = sql.prepare("INSERT OR REPLACE INTO roles (id, role_name, prim_role, guild, role_id) VALUES (@id, @role_name, @prim_role, @guild, @role_id);")
  client.getRoles = sql.prepare("SELECT * FROM roles WHERE guild = ?")
}