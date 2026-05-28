import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message)
})