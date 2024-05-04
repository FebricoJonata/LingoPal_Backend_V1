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
 *     summary: Retrieve a list of quiz
 *     description: Retrieve a list of quiz from the database.
 *     tags:
 *      - Quiz
 *     responses:
 *       '200':
 *         description: A JSON array of quiz.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
quizRouter.get("/", async (req, res) => {
  try {
    let { data: quiz } = await db.from("m_quiz").select("*");

    return res.status(200).json({
      status: 200,
      body: quiz,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

export default quizRouter;
