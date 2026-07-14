import { readConfig, setUser } from "./config";

function main() {
  setUser("Daniel");
  console.log(readConfig());
}

main();