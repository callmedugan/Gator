import { RSSItem } from "src/rss";
import { db } from "..";
import { feeds, posts } from "../schema";
import { Feed } from "./feed";
import { User } from "./users";
import { asc } from "drizzle-orm";

export type Post = typeof posts.$inferSelect;

export async function createPost(feed:Feed, rss:RSSItem){
    let pubDate = new Date(rss.pubDate);
    const [result] = await db
        .insert(posts)
        .values({
            title: rss.title,
            url: rss.link,
            description: rss.description,
            publishedAt: isNaN(pubDate.getTime()) ? null : pubDate,
            feedID: feed.id
        })
        .returning();
    return result
}

export async function getPostsForUser(user: User, limit:number): Promise<Post[]>{
    const result = await db.select().from(posts).orderBy(asc(posts.publishedAt)).limit(limit);
    return result
}