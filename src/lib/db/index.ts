// src/lib/db/index.ts
import mongoose from 'mongoose'
import dns from 'dns'

// Force IPv4 and use Google DNS for SRV resolution to bypass local network restrictions
dns.setDefaultResultOrder('ipv4first')
try {
  dns.setServers(['8.8.8.8', '8.8.4.4'])
} catch (e) {
  console.warn('[connectDB] Could not set custom DNS servers:', e)
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in .env.local')

declare global {
  var _mongooseConn: typeof mongoose | null
  var _mongoosePromise: Promise<typeof mongoose> | null
}

let cached = global._mongooseConn
let promise = global._mongoosePromise

export async function connectDB() {
  if (cached) {
    console.log('[connectDB] Using cached connection')
    return cached
  }

  if (!promise) {
    console.log('[connectDB] Establishing new connection to:', MONGODB_URI.split('@')[1])
    
    // Retry loop for initial connection
    const connectWithRetry = async (retries = 3) => {
      try {
        return await mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          dbName: process.env.DB_NAME || 'bizready',
          serverSelectionTimeoutMS: 15000, // 15 seconds
          family: 4, // Force IPv4
        })
      } catch (err: any) {
        if (retries > 0) {
          console.log(`[connectDB] Connection failed, retrying in 2s... (${retries} retries left)`)
          await new Promise(r => setTimeout(r, 2000))
          return connectWithRetry(retries - 1)
        }
        throw err
      }
    }
    
    promise = connectWithRetry()
  }

  try {
    cached = await promise
    global._mongooseConn = cached
    global._mongoosePromise = promise
    console.log('[connectDB] Connection established successfully')
    return cached
  } catch (error: any) {
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error('[connectDB] SRV resolution failed. Your network may be blocking DNS SRV lookups.')
      console.error('[connectDB] Try using a standard connection string (mongodb://) instead of (mongodb+srv://).')
    }
    console.error('[connectDB] Connection failed stack:', error.stack)
    promise = null // Reset promise on failure
    throw error
  }
}
