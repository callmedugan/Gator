import { db } from "..";
import { eq } from "drizzle-orm";
import { feedFollows, feeds, users } from "../schema";
import { Feed } from "./feed";
import { User } from "./users";

//adds new feed to intermediate db
export async function createFollowFeed(user:User, feed:Feed){
    const [result] = await db.insert(feedFollows).values({userID:user.id, feedID:feed.id}).returning()
    return result
}

//returns all follows with the user and feed names
export async function getAllFeedFollows(){
    const join = await db
        .select({user: users.name, feed: feeds.name})
        .from(feedFollows)
        .innerJoin(users, eq(feedFollows.userID, users.id))
        .innerJoin(feeds, eq(feedFollows.feedID, feeds.id))
    return join;
}

export async function getFeedFollowsForUser(user:User){
    const result = await db
        .select({user: users.name, feed: feeds.name})
        .from(feedFollows)
        .where(eq(feedFollows.userID, user.id))
        .innerJoin(users, eq(feedFollows.userID, users.id))
        .innerJoin(feeds, eq(feedFollows.feedID, feeds.id))
    return result
}