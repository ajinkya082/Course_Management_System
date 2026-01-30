import express from "express";
import { addCourse, EducatorDashboardData, getEducatorCourses,getEnrolledStudentsData, updateRoleEducator } from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

//Add Educator Role
educatorRouter.put('/update-role', updateRoleEducator)
educatorRouter.post('/add-course',upload.single('image'),protectEducator, addCourse)
educatorRouter.get('/courses',protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard',protectEducator,EducatorDashboardData)
educatorRouter.get('/enrolled-students',protectEducator,getEnrolledStudentsData)


export default educatorRouter;