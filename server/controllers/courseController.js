import Course from "../models/Course.js";

// Get All Courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course
      .find({ isPublished: true })
      .select('-courseContent -enrolledStudents')
      .populate('educator');

    res.status(200).json({
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

// Get Course By ID
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {
    const courseData = await Course
      .findById(id)
      .populate('educator');

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Hide non-preview lectures
    courseData.courseContent.forEach(chapter => {
      chapter.chapterContent.forEach(lecture => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

    res.status(200).json({
      success: true,
      courseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
