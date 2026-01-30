import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";

// ===============================
// UPDATE ROLE → EDUCATOR
// ===============================
export const updateRoleEducator = async (req, res) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: "educator",
            },
        });

        res.json({
            success: true,
            message: "You can publish a course now",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ===============================
// ADD COURSE
// ===============================
export const addCourse = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseData } = req.body;
        const imageFile = req.file;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!imageFile) {
            return res.json({
                success: false,
                message: "Thumbnail Not Attached",
            });
        }

        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = userId;

        const newCourse = await Course.create(parsedCourseData);

        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        newCourse.courseThumbnail = imageUpload.secure_url;
        await newCourse.save();

        res.json({
            success: true,
            message: "Course Added Successfully",
            data: newCourse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ===============================
// GET EDUCATOR COURSES
// ===============================
export const getEducatorCourses = async (req, res) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const courses = await Course.find({ educator: userId });

        res.json({
            success: true,
            courses,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

//Get Educator Dashboard Data
export const EducatorDashboardData = async (req, res) => {
    try {
        const {userId} = req.auth();
        const courses = await Course.find({ educator:userId });
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        //calculate total earnings from purchases
        const purchases = await Purchase.find({ courseId: { $in: courseIds }, status: 'completed' });
        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        //collect unique enrolled students ids with course tite
        const enrolledStudentsData = [];
        for (const course of courses) {
            const coursePurchases = await Purchase.find({ _id: { $in: course.enrolledStudents } }, 'name imageUrl');

            coursePurchases.forEach(purchase => {
                enrolledStudentsData.push({
                    courseTitle: course.title,
                    student: purchase.userId
                });
            });

        }
        res.json({
            success: true, dashboardData: {
                totalEarnings, enrolledStudentsData, totalCourses
            }
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// get enrolles students data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth();
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({ courseId: { $in: courseIds }, status: 'completed' }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}
