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

    const query = db.from("m_quiz").select("*");

    if (practice_id) {
      query.eq("practice_id", practice_id);
    }

    const { quiz } = await query;

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
