import React, { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyCourses = () => {
  const { currency, backendURL, isEducator, getToken } = useContext(AppContext)

  const [courses, setCourses] = useState(null)
  const fetchedRef = useRef(false)

  const fetchEducatorCourse = async () => {
    try {
      const token = await getToken()

      const { data } = await axios.get(
        `${backendURL}/api/educator/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (data.success) {
        // Deduplicate for safety
        const uniqueCourses = Array.from(
          new Map((data.courses || []).map(c => [c._id, c])).values()
        )
        setCourses(uniqueCourses)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isEducator && !fetchedRef.current) {
      fetchedRef.current = true
      fetchEducatorCourse()
    }
  }, [isEducator])

  if (!courses) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50 md:p-10 p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          My Courses
        </h2>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 text-left">All Courses</th>
                <th className="px-6 py-4 text-left">Earnings</th>
                <th className="px-6 py-4 text-left">Students</th>
                <th className="px-6 py-4 text-left">Published On</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-600">
              {courses.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-400">
                    No courses found
                  </td>
                </tr>
              )}

              {courses.map(course => (
                <tr
                  key={course._id}
                  className="
                    group
                    border-b last:border-none
                    transition-all duration-300 ease-out
                    hover:scale-[1.015]
                    hover:-translate-y-1
                    hover:shadow-xl
                    hover:bg-white
                  "
                >
                  {/* Course */}
                  <td className="px-6 py-5 flex items-center gap-5">
                    <div className="overflow-hidden rounded-lg w-24 h-14 bg-gray-200">
                      {course.courseThumbnail && (
                        <img
                          src={course.courseThumbnail}
                          alt="course"
                          className="
                            w-full h-full object-cover
                            transition-transform duration-300 ease-out
                            group-hover:scale-110
                          "
                        />
                      )}
                    </div>

                    <span className="font-medium text-gray-800 truncate">
                      {course.courseTitle}
                    </span>
                  </td>

                  {/* Earnings */}
                  <td className="px-6 py-5 font-semibold text-green-600">
                    {currency}
                    {Math.floor(
                      (course.enrolledStudents?.length || 0) *
                        (course.coursePrice -
                          (course.discount * course.coursePrice) / 100)
                    )}
                  </td>

                  {/* Students */}
                  <td className="px-6 py-5">
                    {course.enrolledStudents?.length || 0}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-5">
                    {course.createdAt
                      ? new Date(course.createdAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MyCourses
