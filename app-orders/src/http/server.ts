import '@opentelemetry/auto-instrumentations-node/register'

import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { trace } from '@opentelemetry/api'
import { setTimeout } from 'node:timers/promises'
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { randomUUID } from 'node:crypto'
import { dispachOrderCreated } from '../broker/messages/order_created.ts'
import { tracer } from '../tracer/tracer.ts'

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

  const orderId = randomUUID()

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: 'b90c4eed-77c4-4f6c-94da-a66531277e89',
    amount,
  })

  const span = tracer.startSpan('to sentido q ta gargalando aqui')

  span.setAttribute('teste', 'ola teste')

  await setTimeout(2000)

  span.end()

  trace.getActiveSpan()?.setAttribute('order_id', orderId)

  dispachOrderCreated({
    amount,
    orderId,
    customer: {
      id: 'b90c4eed-77c4-4f6c-94da-a66531277e89',
    }
  })

  return reply.status(201).send({ message: 'Hello World' })
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[order] Http server is running on port 3333 🚀')
})
