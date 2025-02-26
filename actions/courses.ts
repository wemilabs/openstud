"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// Schema for course creation/update validation
const CourseSchema = z.object({
  name: z
    .string()
    .min(3, "Course name must be at least 3 characters")
    .max(50, "Course name must not exceed 50 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable(),
})

export type CourseInput = z.infer<typeof CourseSchema>

const ITEMS_PER_PAGE = 9

interface GetCoursesOptions {
  page?: number
  search?: string
  sortBy?: "name" | "createdAt"
  sortOrder?: "asc" | "desc"
}

/**
 * Creates a new course for the current user
 */
export async function createCourse(input: CourseInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = CourseSchema.parse(input)

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    })

    revalidatePath("/dashboard/courses")
    return { data: course }
  } catch (error) {
    console.error("Error creating course:", error)
    return { error: "Failed to create course" }
  }
}

/**
 * Fetches all courses for the current user with pagination and search
 */
export async function getCourses({
  page = 1,
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetCoursesOptions = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const skip = (page - 1) * ITEMS_PER_PAGE

    const where: Prisma.CourseWhereInput = {
      userId: session.user.id,
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
            ],
          }
        : {}),
    }

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: ITEMS_PER_PAGE,
        skip,
      }),
    ])

    const pageCount = Math.ceil(total / ITEMS_PER_PAGE)

    return {
      data: {
        courses,
        pageCount,
        total,
      },
    }
  } catch (error) {
    console.error("Error fetching courses:", error)
    return { error: "Failed to fetch courses" }
  }
}

/**
 * Fetches a single course by ID
 */
export async function getCourseById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const course = await prisma.course.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!course) {
      return { error: "Course not found" }
    }

    return { data: course }
  } catch (error) {
    console.error("Error fetching course:", error)
    return { error: "Failed to fetch course" }
  }
}

/**
 * Updates an existing course
 */
export async function updateCourse(id: string, input: CourseInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = CourseSchema.parse(input)

    const course = await prisma.course.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: validatedData,
    })

    revalidatePath("/dashboard/courses")
    return { data: course }
  } catch (error) {
    console.error("Error updating course:", error)
    return { error: "Failed to update course" }
  }
}

/**
 * Deletes a course
 */
export async function deleteCourse(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await prisma.course.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    revalidatePath("/dashboard/courses")
    return { data: null }
  } catch (error) {
    console.error("Error deleting course:", error)
    return { error: "Failed to delete course" }
  }
}
