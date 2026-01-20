import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

const app = express()

// Connect DB
connectDB()

app.use(cors())

// 🔐 Clerk webhook (RAW body)
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

// ✅ JSON parser for normal APIs
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.send('API Working')
})

export default app
