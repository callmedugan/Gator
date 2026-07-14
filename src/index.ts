import { readConfig, setUser } from "./config";
import { CommandsRegistry, handlerLogin, registerCommand, runCommand } from "./command";
import process, { exit } from "node:process";

function main() {
  const registry:CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  const args = process.argv.slice(2);
  if(args.length === 0){
    console.log("missing arguments");
    exit(1);
  }
  runCommand(registry, args[0], ...args.slice(1));
}

main();