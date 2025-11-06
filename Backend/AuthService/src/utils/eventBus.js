const EventEmitter = require("events");

class ServiceEventEmitter extends EventEmitter {}
const eventBus = new ServiceEventEmitter();

// Événements disponibles
const EVENTS = {
  USER_DELETED: "USER_DELETED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
};

module.exports = {
  eventBus,
  EVENTS,
};
