import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenvConfig();
const quizRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/quiz:
 *   get:
 *     summary: Retrieve a list of quizzes
 *     description: Retrieve a list of quizzes from the database.
 *     tags:
 *       - Quiz
 *     parameters:
 *       - in: query
 *         name: practice_id
 *         schema:
 *           type: string
 *         description: Filter quizzes by practice id
 *     responses:
 *       '200':
 *         description: A JSON array of quizzes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
quizRouter.get("/", async (req, res) => {
  try {
    const { practice_id } = req.query;

    if (!practice_id) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request: 'practice_id' is required",
      });
    }

    // Query the database for quizzes with the matching practice_id
    const { data: quiz, error } = await db
      .from("m_quiz")
      .select("*")
      .eq("practice_id", practice_id);

    // Check if there was an error in the query
    if (error) {
      console.error("Error fetching quizzes:", error);
      return res.status(500).json({
        status: 500,
        error: "Internal Server Error: Failed to fetch quizzes",
      });
    }

    // If no quizzes were found, return a 404 status
    if (quiz.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No quizzes found for the given practice_id",
      });
    }

    // Return the quizzes in the response
    return res.status(200).json({
      status: 200,
      data: quiz,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /api/quiz/admin:
 *   get:
 *     summary: Retrieve a paginated list of quizzes for admin
 *     description: Retrieve a list of quizzes from the database.
 *     tags:
 *       - Quiz
 *     parameters:
 *       - in: query
 *         name: course_category_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Filter quizzes by course category ID
 *     responses:
 *       '200':
 *         description: A JSON array of materials resource.
 *       '500':
 *         description: Internal Server Error
 */
quizRouter.get("/admin", async (req, res) => {
  try {
    const { course_category_id } = req.query;

    // Parse page and limit, defaulting to 1 and 10 if not provided
    // const pageNum = page ? parseInt(page, 10) : 1; // Default to page 1
    // const limitNum = limit ? parseInt(limit, 10) : 10; // Default to limit of 10
    // const offset = (pageNum - 1) * limitNum;

    // Build the query
    let query = db.rpc("get_quizzes_by_category", {
      icourse_category_id: course_category_id,
    });

    const { data: quiz, error } = await query;

    if (error) {
      throw error;
    }

    // Return the response
    return res.status(200).json({
      status: 200,
      data: quiz,
      // page: pageNum,
      // limit: limitNum,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
    });
  }
});

export default quizRouter;
