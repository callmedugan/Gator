import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};


export async function fetchFeed(url:string):Promise<RSSFeed>{
    const response = await fetch(url, {headers:{"User-Agent": "gator"}})
    const parser = new XMLParser({processEntities:false})
    const xml = parser.parse(await response.text())
    //console.log(JSON.stringify(xml, null, 2))
    if(xml.rss?.channel === undefined){
        console.log("missing channel field from xml object")
        throw new Error("missing channel field from xml object");
    }

    const feed:RSSFeed = {
        channel: {
            title: xml.rss.channel?.title,
            link: xml.rss.channel?.link,
            description: xml.rss.channel?.description,
            item: []
        }
    }

    const xmlItem = xml.rss.channel?.item;
    if(Array.isArray(xmlItem)){
        for(const i of xmlItem){
            if(i.title === undefined || i.link === undefined || i.description === undefined || i.pubDate === undefined) continue;
            feed.channel.item.push({
                title: i?.title,
                link: i?.link,
                description: i?.description,
                pubDate: i?.pubDate
            })
        }
    }
    else if(typeof xmlItem !== undefined){
        if(xmlItem.title != undefined && xmlItem.link != undefined && xmlItem.description != undefined && xmlItem.pubDate != undefined){
            feed.channel.item.push({
                title: xmlItem?.title,
                link: xmlItem?.link,
                description: xmlItem?.description,
                pubDate: xmlItem?.pubDate
            })
        }
    }

    return feed;
}