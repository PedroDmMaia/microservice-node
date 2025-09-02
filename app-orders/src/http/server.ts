import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { channels } from '../broker/channels/index.ts'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { randomUUID } from 'node:crypto'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors)

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.get('/health', () => {
  return 'OK'
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.coerce.number(),
    })
  }
}, async (req, reply) => {
  const { amount } = req.body

  console.log('Creating an order with amount', amount)

  channels.orders.sendToQueue('orders', Buffer.from('Hello World'))

  await db.insert(schema.orders).values({
    id: randomUUID(),
    customerId: 'b90c4eed-77c4-4f6c-94da-a66531277e89',
    amount,
  })

  return reply.status(201).send({ message: 'Hello World' })
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[order] Http server is running on port 3333 🚀')
})
