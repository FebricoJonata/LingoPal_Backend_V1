import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./helpers/middleware.js";

dotenvConfig();
const courseRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/course:
 *   get:
 *     summary: Retrieve a list of courses
 *     description: Retrieve a list of courses from the database.
 *     tags:
 *      - Course
 *     responses:
 *       '200':
 *         description: A JSON array of courses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
courseRouter.get("/", verifyToken, async (req, res) => {
  try {
    let { data: courses } = await db
      .from("m_course")
      .select(
        "course_id, course_name, course_description, min_poin, user_level_id, category:course_category_id(course_category_name)"
      )
      .order("course_id", { ascending: true });

    return res.status(200).json({
      status: 200,
      body: courses,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/course/progress:
 *   get:
 *     summary: Retrieve a list of courses progress
 *     description: Retrieve a list of courses progress from the database.
 *     tags:
 *      - Course
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter users by user id
 *     responses:
 *       '200':
 *         description: A JSON array of courses progress.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
courseRouter.get("/progress", verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    let { data: progress } = await db
      .from("t_user_course_progress")
      .select(
        "progress_course_id, user_id, course_id, progress_poin, is_active, is_course_completed"
      )
      .eq("user_id", user_id)
      .order("progress_course_id", { ascending: true });

    return res.status(200).json({
      status: 200,
      body: progress,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/course/update-progress:
 *   post:
 *     summary: Update user's course progress.
 *     description: Update user's course progress.
 *     tags:
 *       - Course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               course_id:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Course progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course progress updated successfully.
 *                 body:
 *                   type: array
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error.
 */
courseRouter.post("/update-progress", verifyToken, async (req, res) => {
  try {
    const { user_id, course_id } = req.body;

    // Update course progress using RPC (remote stored procedure)
    await db.rpc("update_course_progress", {
      i_user_id: user_id,
      current_course_id: course_id,
    });

    // Update user progress using RPC (remote stored procedure)
    await db.rpc("update_user_progress", { i_user_id: user_id });

    return res.status(200).json({
      status: 200,
      body: "Successfully update course progress",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/course/fetch-course-dropdown:
 *   get:
 *     summary: Fetch course dropdown options.
 *     description: Retrieves a list of courses to populate a dropdown menu.
 *     tags:
 *       - Course
 *     parameters:
 *       - in: query
 *         name: course_category_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: The ID of the course category to filter by.
 *     responses:
 *       '200':
 *         description: Successfully retrieved course dropdown data.
 *       '500':
 *         description: Internal server error.
 */
courseRouter.get("/fetch-course-dropdown", async (req, res) => {
  try {
    const { course_category_id } = req.query;

    const data = await db.rpc("fetch_practice_and_course", {
      i_course_category_id: Number(course_category_id),
    }); // Pass category filter to DB

    return res.status(200).json({
      status: 200,
      body: data.data,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

export default courseRouter;
