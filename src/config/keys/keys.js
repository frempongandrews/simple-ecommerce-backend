import devKeys from "./keys.dev.js";
import prodKeys from "./keys.prod.js";

let keys;

if (process.env.NODE_ENV === "development") {
  keys = devKeys;
} else {
  keys = prodKeys;
}

export default keys;