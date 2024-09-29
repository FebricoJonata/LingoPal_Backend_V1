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

export default quizRouter;
