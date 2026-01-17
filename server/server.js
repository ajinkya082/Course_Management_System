import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

const app = express()

// Connect DB (safe for serverless)
connectDB()

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.send('API Working')
})

// Clerk webhook (RAW body required)
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

// ❌ REMOVE app.listen()
// ✅ EXPORT app for Vercel
export default app
