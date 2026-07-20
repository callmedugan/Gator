import { eq } from "drizzle-orm";
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

export async function getFeeds(): Promise<Feed[]>{
    const result = await db.select().from(feeds);
    return result
}