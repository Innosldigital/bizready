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

const MONGODB_URI = process.env.MONGODB_URI

declare global {
  var _mongooseConn: typeof mongoose | null
  var _mongoosePromise: Promise<typeof mongoose> | null
}

let cached = global._mongooseConn
let promise = global._mongoosePromise

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables')

  if (cached) {
    console.log('[connectDB] Using cached connection')
    return cached
  }

  if (!promise) {
    console.log('[connectDB] Establishing new connection to:', MONGODB_URI.split('@')[1])
    
    // Retry loop for initial connection
    const connectWithRetry = async (retries = 1) => {
      try {
        return await mongoose.connect(MONGODB_URI!, {
          bufferCommands: false,
          dbName: process.env.DB_NAME || 'bizready',
          serverSelectionTimeoutMS: 8000, // 8 seconds per attempt
          connectTimeoutMS: 8000,
          family: 4, // Force IPv4
        })
      } catch (err: any) {
        if (retries > 0) {
          console.log(`[connectDB] Connection failed, retrying once...`)
          await new Promise(r => setTimeout(r, 1000))
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
    promise = null // Reset so next request retries

    if (
      error.message?.includes('querySrv ECONNREFUSED') ||
      error.message?.includes('querySrv ETIMEOUT') ||
      error.message?.includes('querySrv ENOTFOUND')
    ) {
      console.error(
        '[connectDB] DNS SRV lookup failed. Your network or VPN may be blocking SRV records.\n' +
        '[connectDB] Fix: Go to MongoDB Atlas → Connect → Drivers, copy the Standard (non-SRV) connection\n' +
        '[connectDB] string (mongodb://...) and set it as MONGODB_URI in .env.local.\n' +
        '[connectDB] Also ensure your current IP is on the Atlas IP Access List.'
      )
      const friendly = new Error(
        'Cannot reach the database. Your network is blocking MongoDB SRV DNS lookups. ' +
        'Switch to a standard mongodb:// connection string and add your IP to the Atlas allowlist.'
      )
      ;(friendly as any).cause = error
      throw friendly
    }

    console.error('[connectDB] Connection failed:', error.message)
    throw error
  }
}
