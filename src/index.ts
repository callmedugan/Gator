import { readConfig, setUser } from "./config";
import { CommandsRegistry, getLoggedInHandler, handlerAddFeed, handlerAgg, handlerBrowse, handlerDelete, handlerFeeds, handlerFollow, handlerFollowing, handlerLogin, handlerRegister, handlerReset, handlerUnfollow, handlerUsers, registerCommand, runCommand } from "./command";
import process, { exit } from "node:process";
import { fetchFeed } from "./rss";

async function main() {
  // create registry and add login command
  const registry:CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", getLoggedInHandler(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", getLoggedInHandler(handlerFollow));
  registerCommand(registry, "following", getLoggedInHandler(handlerFollowing));
  registerCommand(registry, "unfollow", getLoggedInHandler(handlerUnfollow));
  registerCommand(registry, "delete", getLoggedInHandler(handlerDelete));
  registerCommand(registry, "browse", getLoggedInHandler(handlerBrowse));
  //get the args that were supplied with the start command
  const args = process.argv.slice(2);
  if(args.length === 0){
    console.log("missing arguments");
    exit(1);
  }
  //pass args to the run command which checks to see if a valid command was supplied and execute
  await runCommand(registry, args[0], ...args.slice(1));

  process.exit(0);
}

await main();