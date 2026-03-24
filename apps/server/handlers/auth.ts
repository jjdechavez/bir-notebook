import { eventHandler, toWebRequest } from "h3";

export default eventHandler((event) => {
  return event.context.auth.handler(toWebRequest(event));
});
