import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

const app = express()

// Connect DB
connectDB()

// Clerk webhook MUST be before express.json()
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

// Middlewares for other routes
app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.send('API Working')
})

/* -------------------------------
   ✅ LOCALHOST ONLY
-------------------------------- */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

/* -------------------------------
   ✅ VERCEL
-------------------------------- */
export default app
