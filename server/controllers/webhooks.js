import { Webhook } from "svix";
import Stripe from "stripe";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ============================
   Clerk Webhooks
============================ */
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const evt = whook.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = evt;
    console.log("Clerk Webhook Event:", type);

    if (type === "user.created") {
      await User.create({
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        imageUrl: data.image_url,
        enrolledCourses: [],
      });
      console.log("User created in DB:", data.id);
    }

    if (type === "user.deleted") {
      await User.findByIdAndDelete(data.id);
      console.log("User deleted from DB:", data.id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Clerk Webhook Error:", error.message);
    return res.status(200).json({ success: true }); // must return 200
  }
};

/* ============================
   Stripe Webhooks
============================ */
export const stripeWebhooks = async (req, res) => {
  try {
    const event = req.body;
    console.log("✅ Stripe event:", event.type);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      // 🔑 Find checkout session from payment intent
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      const session = sessions.data[0];
      if (!session) {
        console.log("❌ No checkout session found");
        return res.json({ received: true });
      }

      const purchaseId = session.metadata?.purchaseId;
      if (!purchaseId) {
        console.log("purchaseId missing");
        return res.json({ received: true });
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase || purchase.status === "completed") {
        return res.json({ received: true });
      }

      // ✅ Enroll student
      await Course.findByIdAndUpdate(
        purchase.courseId,
        { $addToSet: { enrolledStudents: purchase.userId } }
      );

      await User.findByIdAndUpdate(
        purchase.userId,
        { $addToSet: { enrolledCourses: purchase.courseId } }
      );

      purchase.status = "completed";
      await purchase.save();

      console.log("🎉 Payment success & enrollment done:", purchaseId);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return res.status(200).json({ received: true });
  }
};
