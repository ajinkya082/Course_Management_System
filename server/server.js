import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

const app = express()

// Connect DB (serverless safe)
connectDB()

app.use(cors())

// ❗ DO NOT use express.json() globally for Clerk
app.get('/', (req, res) => {
  res.send('API Working')
})

// Clerk webhook MUST use RAW body
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

export default app
