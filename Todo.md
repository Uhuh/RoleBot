Role
 - Add: okay
 - Remove: okay
 - Channel: Okay for default messages, but what if we allowed them to pick a category to send.
 - List: okay
 - Message: FIX!!!! it takes the message ID. But specifying a folder is ugly.
 - Move: Might need to be looked at
 - Remove: Should be okay as is
 - Swap: Might need to be looked at
 - Update: Who actually uses this garbage? Maybe make it worth using.
=== Possible additions ===
 - Verification role:
   Take a role ID and message ID and always use a checkmark for the message. 
   Then verifies users this way.
 - Handle roles being removed:
   If a role is removed from the list.. maybe remove the reaction associated with it.

Folder -> Category
 - Add: Horrible offender, this needs to be totally redone.
 - List: Works like role list. Probably fine the way it is.
 - New: This probably confuses people too. The command name new and add confuse me even.
   * Maybe allow users to add descriptions to categories? Default empty
   * Example: `rb category create Dogs | Show what dog breed you love the most!!!!` Maybe.
 - Remove: Probably fine, see if there's a way to improve it.
 - Rename: Why is this a thing, is it actually used?
=== Possible additions ===
 - Titles & Descriptions:
   Users may want to add more detail for some categories. (Look at Maki)

=== What I want to do ===
 - MOVE TO MONGO JUST TO GET OFF OF SQLITE
 - How do I make my database smaller and better?
 - Add command usage logging.
 - Eventually add command reloading.
 - I need to learn how to shard + cluster.
 - I need to learn how to deal with the horrible memory usage
 - I should fix the damn site.
 - Add an erorr embed message to send users to the support server if something happens.