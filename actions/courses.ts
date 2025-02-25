"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Schema for course creation/update validation
const CourseSchema = z.object({
  name: z
    .string()
    .min(3, "Course name must be at least 3 characters")
    .max(50, "Course name must not exceed 50 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters"),
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
    const validatedData = CourseSchema.parse(input)
    const userId = "temp-user-id" // TODO: Get from auth

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        userId,
      },
    })

    revalidatePath("/dashboard/courses")
    return { data: course }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid course data" }
    }
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
    const userId = "temp-user-id" // TODO: Get from auth

    // Calculate skip for pagination
    const skip = (page - 1) * ITEMS_PER_PAGE

    // Build where clause for search
    const where = {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    // Get total count for pagination
    const totalCount = await prisma.course.count({ where })
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    // Get courses with pagination and sorting
    const courses = await prisma.course.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: ITEMS_PER_PAGE,
    })

    return {
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    }
  } catch (error) {
    return { error: "Failed to fetch courses" }
  }
}

/**
 * Fetches a single course by ID
 */
export async function getCourseById(id: string) {
  try {
    const userId = "temp-user-id" // TODO: Get from auth

    const course = await prisma.course.findFirst({
      where: { 
        id,
        userId, // Ensure user owns the course
      },
    })

    if (!course) {
      return { error: "Course not found" }
    }

    return { data: course }
  } catch (error) {
    return { error: "Failed to fetch course" }
  }
}

/**
 * Updates an existing course
 */
export async function updateCourse(id: string, input: CourseInput) {
  try {
    const validatedData = CourseSchema.parse(input)
    const userId = "temp-user-id" // TODO: Get from auth

    // Check if course exists and belongs to user
    const existingCourse = await prisma.course.findFirst({
      where: { 
        id,
        userId,
      },
    })

    if (!existingCourse) {
      return { error: "Course not found" }
    }

    const course = await prisma.course.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath("/dashboard/courses")
    return { data: course }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid course data" }
    }
    return { error: "Failed to update course" }
  }
}

/**
 * Deletes a course
 */
export async function deleteCourse(id: string) {
  try {
    const userId = "temp-user-id" // TODO: Get from auth

    // Check if course exists and belongs to user
    const existingCourse = await prisma.course.findFirst({
      where: { 
        id,
        userId,
      },
    })

    if (!existingCourse) {
      return { error: "Course not found" }
    }

    await prisma.course.delete({
      where: { id },
    })

    revalidatePath("/dashboard/courses")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete course" }
  }
}
