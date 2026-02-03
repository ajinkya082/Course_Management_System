// import express from "express";
import e from "express";
import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
    userId :{type:String, required:true},
    courseId :{type:String, required:true},
    completed:{type:Boolean, default:false},
    lecturesCompleted:[],


},{minimize:false});

const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);

export default CourseProgress;