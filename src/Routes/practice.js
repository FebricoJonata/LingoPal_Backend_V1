import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenvConfig();
const practiceRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/practice:
 *   get:
 *     summary: Retrieve a list of practices
 *     description: Retrieve a list of practices from the database.
 *     tags:
 *      - Practice
 *     parameters:
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *         description: Filter users by course id
 *     responses:
 *       '200':
 *         description: A JSON array of practices.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
practiceRouter.get("/", async (req, res) => {
  try {
    const { course_id } = req.query;

    let { data: practices } = await db
      .from("m_practice")
      .select("*, course:course_id(course_name, course_description)")
      .eq("course_id", course_id);

    return res.status(200).json({
      status: 200,
      body: practices,
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
 * /api/practice/progress:
 *   get:
 *     summary: Retrieve a list of practices progress
 *     description: Retrieve a list of practices progress from the database.
 *     tags:
 *      - Practice
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter users by user id
 *     responses:
 *       '200':
 *         description: A JSON array of practices progress.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
practiceRouter.get("/progress", async (req, res) => {
  try {
    const { user_id } = req.query;

    const { data: progress } = await db
      .from("t_user_practice_progress")
      .select(
        "progress_practice_id, user_id, practice_id, progress_poin, is_active, is_passed, practice:practice_id(practice_code)"
      )
      .eq("user_id", user_id)
      .order("progress_practice_id", { ascending: true });

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
 * /api/practice/progress:
 *   post:
 *     summary: Update user's practice progress.
 *     description: Update user's practice progress.
 *     tags:
 *       - Practice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress_practice_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               practice_id:
 *                 type: integer
 *               course_id:
 *                 type: integer
 *               progress_poin:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *               is_passed:
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
practiceRouter.post("/progress", async (req, res) => {
  try {
    const {
      progress_practice_id,
      user_id,
      progress_poin,
      is_active,
      is_passed,
      practice_id,
      course_id,
    } = req.body;

    const currentTimestamp = new Date().toLocaleString("id-ID", {
      timeZone: "UTC",
    });

    let progress;
    if (progress_practice_id !== 0) {
      // If record exists, update it
      const { data: updatedProgress, error: updateError } = await db
        .from("t_user_practice_progress")
        .update({
          progress_poin,
          is_active,
          is_passed,
          practice_id,
          updated_at: currentTimestamp,
        })
        .eq("progress_practice_id", progress_practice_id)
        .eq("user_id", user_id)
        .select(
          "progress_practice_id, user_id, practice_id, progress_poin, is_active, is_passed"
        );

      if (updateError) {
        return res.status(500).json({
          status: 500,
          error: "Failed to update the record",
        });
      }

      progress = updatedProgress;
    } else {
      // If record doesn't exist, insert a new one
      const { data: insertedProgress, error: insertError } = await db
        .from("t_user_practice_progress")
        .insert({
          user_id,
          practice_id,
          progress_poin,
          is_active,
          is_passed,
          updated_at: currentTimestamp,
        })
        .select(
          "progress_practice_id, user_id, practice_id, progress_poin, is_active, is_passed"
        );

      if (insertError) {
        return res.status(500).json({
          status: 500,
          error: "Failed to insert new record",
        });
      }

      progress = insertedProgress;
    }

    await db.rpc("update_user_course_progress_poin", {
      i_user_id: user_id,
      i_course_id: course_id,
    });

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

export default practiceRouter;
