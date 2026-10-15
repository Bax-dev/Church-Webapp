/**
 * Short-lived keys (sessions, one-time links, rate limits, caches) in DynamoDB, replacing Redis.
 * Table: partition key `pk`, sort key `sk` (both strings), TTL attribute `expiresAt` (epoch seconds).
 * A key is either a string (stored with sk "#") or [pk, sk], so related keys can be listed or dropped together.
 * DynamoDB removes expired items lazily (within ~48h), so every read also checks `expiresAt` itself.
 * In development without DYNAMODB_TABLE, keys live in this process's memory and are lost on restart.
 */
import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { env } from '@/lib/server/env'

export type Key = string | [pk: string, sk: string]

type Store = {
  get(key: Key): Promise<string | undefined>
  set(key: Key, value: string, ttlSeconds: number): Promise<void>
  del(key: Key): Promise<void>
  /** Deletes and returns the value in one step. */
  getdel(key: Key): Promise<string | undefined>
  /** Deletes every key [pk, *]. */
  delGroup(pk: string): Promise<void>
  /** Fixed-window counter: the window starts at the first increment. */
  incr(key: Key, windowSeconds: number): Promise<{ count: number; expiresAt: number }>
}

const now = () => Math.floor(Date.now() / 1000)
const split = (key: Key) => (typeof key === 'string' ? { pk: key, sk: '#' } : { pk: key[0], sk: key[1] })
const live = (item: Record<string, unknown> | undefined) => (item && Number(item.expiresAt) > now() ? item : undefined)

function dynamoStore(table: string): Store {
  const globalForDynamo = globalThis as unknown as { pcnDynamo?: DynamoDBDocumentClient }
  globalForDynamo.pcnDynamo ??= DynamoDBDocumentClient.from(new DynamoDBClient({ endpoint: env.dynamo.endpoint }))
  const client = globalForDynamo.pcnDynamo

  return {
    async get(key) {
      const { Item } = await client.send(new GetCommand({ TableName: table, Key: split(key), ConsistentRead: true }))
      return live(Item)?.v as string | undefined
    },
    async set(key, value, ttlSeconds) {
      await client.send(new PutCommand({ TableName: table, Item: { ...split(key), v: value, expiresAt: now() + ttlSeconds } }))
    },
    async del(key) {
      await client.send(new DeleteCommand({ TableName: table, Key: split(key) }))
    },
    async getdel(key) {
      const { Attributes } = await client.send(new DeleteCommand({ TableName: table, Key: split(key), ReturnValues: 'ALL_OLD' }))
      return live(Attributes)?.v as string | undefined
    },
    async delGroup(pk) {
      let start: Record<string, unknown> | undefined
      do {
        const page = await client.send(new QueryCommand({
          TableName: table,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: { ':pk': pk },
          ProjectionExpression: 'pk, sk',
          ExclusiveStartKey: start,
        }))
        await Promise.all((page.Items ?? []).map((item) => client.send(new DeleteCommand({ TableName: table, Key: { pk: item.pk, sk: item.sk } }))))
        start = page.LastEvaluatedKey
      } while (start)
    },
    async incr(key, windowSeconds) {
      const t = now()
      try {
        // Counts up only while the current window is open.
        const { Attributes } = await client.send(new UpdateCommand({
          TableName: table,
          Key: split(key),
          UpdateExpression: 'ADD v :one',
          ConditionExpression: 'expiresAt > :now',
          ExpressionAttributeValues: { ':one': 1, ':now': t },
          ReturnValues: 'ALL_NEW',
        }))
        return { count: Number(Attributes!.v), expiresAt: Number(Attributes!.expiresAt) }
      } catch (error) {
        if (!(error instanceof ConditionalCheckFailedException)) throw error
        // No key yet, or its window has passed: start a new one.
        const expiresAt = t + windowSeconds
        await client.send(new PutCommand({ TableName: table, Item: { ...split(key), v: 1, expiresAt } }))
        return { count: 1, expiresAt }
      }
    },
  }
}

function memoryStore(): Store {
  const globalForMemory = globalThis as unknown as { pcnKv?: Map<string, { v: string | number; expiresAt: number }> }
  const map = (globalForMemory.pcnKv ??= new Map())
  const id = (key: Key) => { const { pk, sk } = split(key); return `${pk}\u0000${sk}` }
  const read = (key: Key) => { const item = map.get(id(key)); return item && item.expiresAt > now() ? item : undefined }

  return {
    async get(key) { const item = read(key); return item && String(item.v) },
    async set(key, value, ttlSeconds) { map.set(id(key), { v: value, expiresAt: now() + ttlSeconds }) },
    async del(key) { map.delete(id(key)) },
    async getdel(key) { const item = read(key); map.delete(id(key)); return item && String(item.v) },
    async delGroup(pk) { for (const k of map.keys()) if (k.startsWith(`${pk}\u0000`)) map.delete(k) },
    async incr(key, windowSeconds) {
      const item = read(key)
      const next = item ? { v: Number(item.v) + 1, expiresAt: item.expiresAt } : { v: 1, expiresAt: now() + windowSeconds }
      map.set(id(key), next)
      return { count: next.v, expiresAt: next.expiresAt }
    },
  }
}

let store: Store | undefined
const pick = () => (store ??= env.dynamo.table ? dynamoStore(env.dynamo.table) : memoryStore())

export const kv: Store = {
  get: (key) => pick().get(key),
  set: (key, value, ttl) => pick().set(key, value, ttl),
  del: (key) => pick().del(key),
  getdel: (key) => pick().getdel(key),
  delGroup: (pk) => pick().delGroup(pk),
  incr: (key, window) => pick().incr(key, window),
}
