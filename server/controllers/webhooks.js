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
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      /* ============================
         Successful Checkout Payment
      ============================ */
      case "checkout.session.completed": {
        const session = event.data.object;

        const purchaseId = session.metadata?.purchaseId;
        if (!purchaseId) {
          console.error("Purchase ID missing in session metadata");
          break;
        }

        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.error("Purchase not found:", purchaseId);
          break;
        }

        // Prevent double-processing
        if (purchaseData.status === "completed") break;

        // ✅ Add user to course enrolledStudents
        await Course.findByIdAndUpdate(
          purchaseData.courseId,
          { $addToSet: { enrolledStudents: purchaseData.userId } }
        );

        // ✅ Add course to user's enrolledCourses
        await User.findByIdAndUpdate(
          purchaseData.userId,
          { $addToSet: { enrolledCourses: purchaseData.courseId } }
        );

        // ✅ Mark purchase as completed
        purchaseData.status = "completed";
        await purchaseData.save();

        console.log("Purchase completed & student enrolled:", purchaseId);
        break;
      }

      /* ============================
         Failed Payment
      ============================ */
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        // Get Purchase ID from Checkout session
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const purchaseId = sessionList.data[0]?.metadata?.purchaseId;
        if (!purchaseId) break;

        await Purchase.findByIdAndUpdate(purchaseId, { status: "failed" });
        console.log("Payment failed for purchase:", purchaseId);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing Stripe webhook:", err);
  }

  res.json({ received: true });
};
