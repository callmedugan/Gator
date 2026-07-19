import { exit } from "node:process";
import { readConfig, setUser } from "./config";
import { createUser, getUser, getUsers, resetUsers } from "./db/queries/users";
import { fetchFeed } from "./rss";

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

// function to lsit all users through cli
export async function handlerUsers(name: string, ...args:string[]){
    //get current
    const current = readConfig().currentUserName;
    //get users from db and print
    const users = await getUsers();
    for(const u of users){
        console.log(u.name === current ? "* " + u.name + " (current)" : "* " + u.name);
    }
}

// function to reset the db through cli
export async function handlerReset(name: string, ...args:string[]){
    //add user to db
    await resetUsers();
    console.log("Users have been reset.");
}

// function to pull an rss feed 
export async function handlerAgg(name: string, ...args:string[]){
    const response = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(JSON.stringify(response, null, 2))
}