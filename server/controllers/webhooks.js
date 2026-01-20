import { Webhook } from "svix";
import User from "../models/User.js";
import connectDB from "../configs/mongodb.js";

export const clerkWebhooks = async (req, res) => {
  try {
    // ✅ ENSURE DB CONNECTION
    await connectDB();

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
        name: `${data.first_name} ${data.last_name}`,
        imageUrl: data.image_url,
        enrolledCourses: [],
      });
      console.log("User created:", data.id);
    }

    if (type === "user.deleted") {
      await User.findByIdAndDelete(data.id);
      console.log("User deleted:", data.id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.status(200).json({ success: true }); // IMPORTANT
  }
};
