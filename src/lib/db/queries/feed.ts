import { eq, asc, sql } from "drizzle-orm";
import { db } from "../index";
import { feeds } from "../schema";

export type Feed = typeof feeds.$inferSelect;

export async function createFeed(name:string, url:string, userID:string){
    if(name == null || name === "" || url == null || url === "" || userID == null || userID === ""){
        throw new Error("null data provided to create feed")
    }
    const [result] = await db.insert(feeds).values({ name: name, url:url, userID:userID}).returning();
    return result
}

export async function getFeedByURL(url:string): Promise<Feed>{
    const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
    return result
}

export async function deleteFeedByURL(url:string): Promise<Feed>{
    const [result] = await db.delete(feeds).where(eq(feeds.url, url)).returning();
    if(result == null || result == undefined) throw new Error("could not find feed to delete for url: " + url)
    console.log("deleted feed for url: " + url)
    return result
}

export async function getFeeds(): Promise<Feed[]>{
    const result = await db.select().from(feeds);
    return result
}

//sets the feed fetch date
export async function markFeedFetched(id:string): Promise<Feed>{
    const [result] = await db.update(feeds).set({lastFetchedAt: new Date()}).where(eq(feeds.id, id)).returning();
    console.log("set to fetched: " + result.name + " updated at: " + result.lastFetchedAt)
    return result
}

export async function getNextFeedToFetch(): Promise<Feed>{
    const [result] = await db.select().from(feeds).orderBy(asc(feeds.lastFetchedAt).append(sql` nulls first`));
    if(result == null || result == undefined) throw new Error("could not find next feed to fetch")
    console.log("oldest feed is: " + result.name + " updated at: " + result.lastFetchedAt)
    return result;
}