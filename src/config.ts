import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
    dbUrl: string,
    currentUserName: string
}

//writes a Config object to the JSON file after setting the current_user_name field.
export function setUser(user:string){
    const currentConfig = readConfig()
    const rawConfig = {
        db_url: currentConfig.dbUrl,
        current_user_name: user
    }
    const data = JSON.stringify(rawConfig);
    fs.writeFileSync(getConfigFilePath(), data);
}

//reads the JSON file found at ~/.gatorconfig.json and returns a Config object. 
export function readConfig():Config{
    const read = fs.readFileSync(getConfigFilePath(), {encoding: "utf8"});
    const result = JSON.parse(read);
    return validateConfig(result);
}

function getConfigFilePath(): string{
    return path.join(os.homedir(),"gatorconfig.json")
}

// validate that json is valid and convert to camelcase obj
function validateConfig(raw: any): Config{
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new Error("config must be an object");
    }
    if(typeof raw.db_url !== "string" || typeof raw.current_user_name !== "string"){
        throw new Error("invalid json structure")
    }

    return {
        dbUrl: raw.db_url,
        currentUserName: raw.current_user_name
    }
}