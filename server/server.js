import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";

import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";

import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import userRouter from "./routes/userRoutes.js";

import { clerkMiddleware } from "@clerk/express";

const app = express();

/* ============================
   DATABASE
============================ */
connectDB();
connectCloudinary();

/* ============================
   🔴 STRIPE WEBHOOK (RAW BODY)
   MUST be BEFORE express.json()
============================ */
app.post("/stripe", express.json(), stripeWebhooks);



/* ============================
   🔴 CLERK WEBHOOK (RAW BODY)
============================ */
app.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

/* ============================
   GLOBAL MIDDLEWARES
============================ */
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ⛔ IMPORTANT: AFTER webhooks only
app.use(express.json());

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

/* ============================
   ROUTES
============================ */
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

/* ============================
   TEST ROUTE
============================ */
app.get("/", (req, res) => {
  res.status(200).send("API Working 🚀");
});

/* ============================
   SERVER START
============================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
