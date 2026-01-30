import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudinary from './configs/cloudinary.js'
import courseRouter from './routes/courseRoutes.js'
import userRouter from './routes/userRoutes.js'

const app = express()

/* ============================
   DATABASE
============================ */
connectDB()
connectCloudinary()

/* ============================
   CLERK WEBHOOK (RAW BODY)
   MUST BE BEFORE express.json
============================ */
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

/* ============================
   GLOBAL MIDDLEWARES
============================ */
app.use(cors())
app.use(express.json())
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
)


/* ============================
   ROUTES
============================ */
app.use('/api/educator', educatorRouter)
app.use('/api/course',express.json(),courseRouter)
app.use('/api/user',express.json(),userRouter)
app.post('/stripe',express.raw({type:'application/json'}),stripeWebhooks)

/* ============================
   TEST ROUTE
============================ */
app.get('/', (req, res) => {
  res.status(200).send('API Working')
})

/* ============================
   LOCAL SERVER START
   (Ignored by serverless)
============================ */
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


export default app
