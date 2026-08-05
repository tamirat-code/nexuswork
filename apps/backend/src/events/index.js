import { EventEmitter } from "node:events";

// Lightweight in-process event bus so modules can react to domain events
// (e.g. "milestone.approved" triggers a notification) without importing
// each other directly. Swap for a message queue if this needs to scale
// across multiple backend instances.
export const eventBus = new EventEmitter();
