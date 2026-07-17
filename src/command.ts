import { exit } from "node:process";
import { setUser } from "./config";
import { createUser, getUser } from "./db/queries/users";

export type CommandsRegistry = Record<string, CommandHandler>

//adds command to the active registry, mapped to a handler fn
export function registerCommand(registry:CommandsRegistry, commandName: string, handler:CommandHandler){
    registry[commandName] = handler;
}

//runs command
export async function runCommand(registry:CommandsRegistry, commandName:string, ...args:string[]){
    await registry[commandName](commandName, ...args);
}

type CommandHandler = (commandName: string, ...args: string[]) => Promise<void>;

// function to login when called in cli
export async function handlerLogin(name: string, ...args:string[]){
    if(args.length === 0){
        console.log("expected username to be given")
        exit(1)
    }

    //check if user exits beforehand
    const userExists = await getUser(args[0]);
    if(!userExists){
        console.log("User " + args[0] + " not registered!")
        exit(1);
    }

    setUser(args[0]);
    console.log("User has been set to: " + args[0]);
}

// function to add a user to the db through cli
export async function handlerRegister(name: string, ...args:string[]){
    if(args.length === 0){
        console.log("expected username to be given")
        exit(1)
    }

    //check if user exits beforehand
    const userExists = await getUser(args[0]);
    if(userExists){
        console.log("User " + args[0] + " already exists!")
        exit(1);
    }

    //add user to db
    const registeredUser = await createUser(args[0]);
    console.log("User " + args[0] + " has been registered.");
    console.log(registeredUser);
    //set current user
    setUser(args[0]);
}

