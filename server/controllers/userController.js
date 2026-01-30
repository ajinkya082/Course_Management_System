import Stripe from "stripe";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";

export const getUserData = async (req, res) => {
    try {
        const  {userId}  = req.auth();
        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        });
    }
}

// Users Enrolled Courses With Lectures Links
export const userEnrolledCourses = async (req, res) => {
    try {
        const  {userId}  = req.auth();
        const userData = await User.findById(userId).populate('enrolledCourses');

        res.json({
            success: true,
            enrolledCourses: userData.enrolledCourses,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        }); 
    }
}
// Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const { userId } = req.auth();

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.status(404).json({
        success: false,
        message: "User or Course not found",
      });
    }

    // ✅ SAFE PRICE CALCULATION
    const price = Number(courseData.coursePrice);
    const discount = Number(courseData.discount || 0);

    const amount = price - (price * discount) / 100;

    if (isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price data",
      });
    }

    // ✅ SAVE PURCHASE (NUMBER ONLY)
    const newPurchase = await Purchase.create({
      courseId: courseData._id,
      userId,
      amount, // NUMBER
      status: "pending",
    });

    // Stripe init
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: courseData.courseTitle,
            },
            unit_amount: Math.round(amount * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
