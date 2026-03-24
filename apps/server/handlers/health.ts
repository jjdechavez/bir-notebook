import { eventHandler } from "h3";

export default eventHandler((event) => {
  return {
    status: "ok",
    uptime: process.uptime(),
    requestId: event.context.requestId
  };
});
