import { channels } from "../channels/index.ts";
import type { OrderCreatedMessage } from '../.././../../contract/messages/order-creted-message.ts'

export function dispachOrderCreated(data: OrderCreatedMessage) {
  channels.orders.sendToQueue('orders', Buffer.from(JSON.stringify(data)))
}
