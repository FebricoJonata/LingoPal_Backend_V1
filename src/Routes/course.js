import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

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
courseRouter.get("/", async (req, res) => {
  try {
    let { data: courses } = await db
      .from("m_course")
      .select(
        "course_id, course_name, course_description, min_poin, user_level_id, category:course_category_id(course_category_name)"
      );

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
courseRouter.get("/progress", async (req, res) => {
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
 * /api/course/progress:
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
 *               progress_course_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               course_id:
 *                 type: integer
 *               progress_poin:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *               is_course_completed:
 *                 type: boolean
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
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found.
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
courseRouter.post("/progress", async (req, res) => {
  try {
    const {
      progress_course_id,
      user_id,
      progress_poin,
      is_active,
      is_course_completed,
      course_id,
    } = req.body;

    const currentTimestamp = new Date().toLocaleString("id-ID", {
      timeZone: "UTC",
    });

    let progress;

    if (progress_course_id === 0) {
      // Insert a new record if progress_course_id is 0
      const { data: insertedProgress, error: insertError } = await db
        .from("t_user_course_progress")
        .insert({
          user_id: user_id,
          course_id: course_id,
          progress_poin: progress_poin,
          is_active: is_active,
          is_course_completed: is_course_completed,
          updated_at: currentTimestamp,
        })
        .select(
          "progress_course_id, user_id, course_id, progress_poin, is_active, is_course_completed"
        );

      if (insertError) {
        return res.status(500).json({
          status: 500,
          error: "Failed to insert new record",
        });
      }

      progress = insertedProgress;
    } else {
      // Update the existing record if progress_course_id is not 0
      const { data: updatedProgress, error: updateError } = await db
        .from("t_user_course_progress")
        .update({
          progress_poin: progress_poin,
          is_active: is_active,
          is_course_completed: is_course_completed,
          course_id: course_id,
          updated_at: currentTimestamp,
        })
        .eq("user_id", user_id)
        .eq("progress_course_id", progress_course_id)
        .select(
          "progress_course_id, user_id, course_id, progress_poin, is_active, is_course_completed"
        );

      if (updateError) {
        return res.status(500).json({
          status: 500,
          error: "Failed to update record",
        });
      }

      progress = updatedProgress;
    }

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

export default courseRouter;
