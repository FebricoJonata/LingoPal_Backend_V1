import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./helpers/middleware.js";

dotenvConfig();
const wordsRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/word:
 *   get:
 *     summary: Retrieve a list of words
 *     description: Retrieve a list of words from the database.
 *     tags:
 *      - Word
 *     responses:
 *       '200':
 *         description: A JSON array of words.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
wordsRouter.get("/", verifyToken, async (req, res) => {
  try {
    let { data: words } = await db.from("m_word").select("word, alphabet");

    return res.status(200).json({
      status: 200,
      body: words,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

export default wordsRouter;
