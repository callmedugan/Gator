import { readConfig, setUser } from "./config";
import { CommandsRegistry, handlerLogin, handlerRegister, registerCommand, runCommand } from "./command";
import process, { exit } from "node:process";

async function main() {
  // create registry and add login command
  const registry:CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
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