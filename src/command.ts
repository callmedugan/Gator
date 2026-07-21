import { exit } from "node:process";
import { readConfig, setUser } from "./config";
import { createUser, getUser, getUserByID, getUsers, resetUsers, User } from "./lib/db/queries/users";
import { createFeed, deleteFeedByURL, Feed, getFeedByURL, getFeeds, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feed";
import { fetchFeed, RSSFeed } from "./rss";
import { createFollowFeed, deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/user_feed";
import { userInfo } from "node:os";
import { createPost, getPostsForUser } from "./lib/db/queries/posts";

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
    await resetUsers();
    console.log("Users have been reset.");
}

// function to pull an rss feed 
export async function handlerAgg(name: string, ...args:string[]){
    //const response = await fetchFeed("https://www.wagslane.dev/index.xml");
    //console.log(JSON.stringify(response, null, 2))
    let intervalDuration = 1000;
    if(args.length === 0){
        console.log("expected time between requests to be given in duration string ex: 1h, 1m, 1s, 1ms")
        exit(1)
    }
    try{
        //check for valid interval duration
        intervalDuration = parseDuration(args[0]);
        if(intervalDuration < 1000) throw new Error("interval must be at least 1s or 1000ms")
        console.log("Collecting feeds every " + args[0])
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
    //start the aggregator
    scrapeFeeds().catch(handleError)
    //use set interval to repeat scrape feeds
    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
        }, intervalDuration);

    //add listener for when program is killed to clear interval
    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("\nShutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

//used to convert duration string to ms number
function parseDuration(durationStr: string): number{
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if(match == null) throw new Error("invalid time string given")
    //convert
    let result = Number(match[1])
    if(match[2] === "s") result *= 1000;
    else if(match[2] === "m") result *= 1000 * 60;
    else if(match[2] === "h") result *= 1000 * 60 * 60;
    return result;
}

async function scrapeFeeds(){
    try{
        const next:Feed = await getNextFeedToFetch();
        await markFeedFetched(next.id)
        const rssFeed:RSSFeed = await fetchFeed(next.url)
        //console.log(JSON.stringify(rssFeed, null, 2))
        //loop through items and attempt to insert
        for(const item of rssFeed.channel.item){
            try{
                const post = await createPost(next, item)
                console.log("Added post: " + post.title);
            }catch(err){
                console.log("Already added post for: " + item.link)
            }
        }
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        //exit(1)
    }
}

function handleError(err: Error){
    console.log(err.message);
}

// function view user posts starting with oldest
export async function handlerBrowse(name: string, user:User, ...args:string[]){
    const limit = args.length === 0 ? 2 : Number(args[0])
    try{
        const posts = await getPostsForUser(user, limit);
        for(const p of posts){
            console.log((p.publishedAt?.toLocaleDateString() || "") + " " +(p.title || ""));
        }
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
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

//used to delete a feed by url
export async function handlerDelete(name: string, user:User, ...args:string[]){
    if(args.length === 0){
        console.log("expected url to be given")
        exit(1)
    }
    try{
        const url = args[0]
        const deletedFeed = await deleteFeedByURL(url)
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

// function to remove a user/feed relationship in the db
export async function handlerUnfollow(name: string, user:User, ...args:string[]){
    if(args.length === 0){
        console.log("expected feed url to be given")
        exit(1)
    }
    try{
        // get url
        const url = args[0];
        const feed:Feed = await getFeedByURL(url);
        const deleted = await deleteFeedFollow(user, feed);
        if(deleted != undefined) console.log(user.name + " unfollowed " + feed.name);
    }catch(err){
        if(err instanceof Error) console.log(err.message);
        else console.log("unknown error")
        exit(1)
    }
}