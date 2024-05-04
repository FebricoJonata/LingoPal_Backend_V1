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
        "course_id, course_name, course_description, min_poin, user_level_id, course_category_id"
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

export default courseRouter;
