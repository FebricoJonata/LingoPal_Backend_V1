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
    let { data: practices } = await db.from("m_practice").select("*");

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

    let { data: progress } = await db
      .from("t_user_practice_progress")
      .select("*")
      .eq("user_id", user_id);

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
