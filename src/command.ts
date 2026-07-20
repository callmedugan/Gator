import { exit } from "node:process";
import { readConfig, setUser } from "./config";
import { createUser, getUser, getUserByID, getUsers, resetUsers, User } from "./db/queries/users";
import { createFeed, Feed, getFeedByURL, getFeeds } from "./db/queries/feed";
import { fetchFeed } from "./rss";
import { createFollowFeed, getFeedFollowsForUser } from "./db/queries/user_feed";
import { userInfo } from "node:os";

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

//used for any commands that require the user to be logged in
type UserCommandHandler = (commandName: string, user: User, ...args: string[]) => Promise<void>;

export function getLoggedInHandler(handler: UserCommandHandler):CommandHandler{
    return async (commandName:string, ...args:string[]) => {
        const currentUser = await getUser(readConfig().currentUserName)
        if(!currentUser){
            console.log("user not logged in")
            exit(1)
        }
        return handler(commandName, currentUser, ...args)
    }
}

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

// function to add a feed to db
export async function handlerAddFeed(name: string, user:User, ...args:string[]){
    if(args.length < 2){
        console.log("expected name and url to be given")
        exit(1)
    }
    try{
        //get current user
        const read = readConfig().currentUserName;
        const currentUser:User = await getUser(read);
        // get url
        const feedName = args[0]
        const url = args[1];
        // create feed and add to db
        const newFeed:Feed = await createFeed(feedName, url, currentUser.id)
        const follow = await createFollowFeed(currentUser, newFeed)
        console.log(newFeed);
        console.log(currentUser);
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
}

// function to print all feeds in db
export async function handlerFeeds(name: string, ...args:string[]){
    try{
        //get all feed items
        const feeds = await getFeeds();
        for(const f of feeds){
            const user = await getUserByID(f.userID)
            console.log(f.name, f.url, user)
        }
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
}

// function to create a user/feed relationship in the db
export async function handlerFollow(name: string, user:User, ...args:string[]){
    if(args.length === 0){
        console.log("expected url to be given")
        exit(1)
    }
    try{
        //get current user
        const currentUser:User = await getUser(readConfig().currentUserName);
        // get url
        const url = args[0];
        const feed:Feed = await getFeedByURL(url);
        const newFeed = await createFollowFeed(currentUser, feed);
        console.log(currentUser.name + " followed " + feed.name);
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
}

// function to print names of the feeds current user is following
export async function handlerFollowing(name: string, user:User, ...args:string[]){
    try{
        //get current user
        const currentUser:User = await getUser(readConfig().currentUserName);
        // get url
        const following = await getFeedFollowsForUser(currentUser);
        for(const f of following){
            console.log(f.feed);
        }
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
}