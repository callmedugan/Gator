import { exit } from "node:process";
import { setUser } from "./config";

export type CommandsRegistry = Record<string, CommandHandler>

//adds command to the active registry, mapped to a handler fn
export function registerCommand(registry:CommandsRegistry, commandName: string, handler:CommandHandler){
    registry[commandName] = handler;
}

//runs command
export function runCommand(registry:CommandsRegistry, commandName:string, ...args:string[]){
    registry[commandName](commandName, ...args);
}

type CommandHandler = (commandName: string, ...args: string[]) => void;

// function to login when called in cli
export function handlerLogin(name: string, ...args:string[]){
    if(args.length === 0){
        console.log("expected username to be given")
        exit(1)
    }

    setUser(args[0]);
    console.log("User has been set to:" + args[0]);
}