import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./helpers/middleware.js";

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
quizRouter.get("/", verifyToken, async (req, res) => {
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
 *     summary: Retrieve a list of quizzes for admin
 *     description: Retrieve a list of quizzes from the database.
 *     tags:
 *       - Quiz
 *     parameters:
 *       - in: query
 *         name: course_category_id
 *         required: true
 *         schema:
 *           type: string
 *         name: course_name
 *         schema:
 *           type: string
 *         name: question
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
    const { course_category_id, course_name, question } = req.query;

    // Build the query
    let query = db.rpc("get_quizzes_by_category", {
      icourse_category_id: course_category_id,
      icourse_name: course_name,
      iquestion: question,
    });

    const { data: quiz, error } = await query;

    if (error) {
      throw error;
    }

    // Return the response
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
 * /api/quiz/admin/create:
 *   post:
 *     summary: Create a new quiz
 *     description: Add a new quiz to the database.
 *     tags:
 *       - Quiz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: The quiz question
 *               practice_id:
 *                 type: integer
 *                 description: The ID of the associated practice
 *               answer_key:
 *                 type: string
 *                 description: The correct answer key for the quiz
 *               choices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The list of possible answers
 *     responses:
 *       '200':
 *         description: Quiz created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Quiz created successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
quizRouter.post("/admin/create", async (req, res) => {
  try {
    const { question, practice_id, answer_key, choices } = req.body;

    const { data, error } = await db
      .from("m_quiz")
      .insert([{ question, practice_id, answer_key, choices }])
      .select("*");

    if (error) {
      throw error;
    }

    return res.status(200).json({
      status: 200,
      message: "Quiz created successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /api/quiz/admin/update:
 *   put:
 *     summary: Update an existing quiz
 *     description: Update the details of an existing quiz by its ID.
 *     tags:
 *       - Quiz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The ID of the quiz to update
 *               question:
 *                 type: string
 *                 description: The updated quiz question
 *               practice_id:
 *                 type: integer
 *                 description: The updated associated practice ID
 *               answer_key:
 *                 type: string
 *                 description: The updated correct answer key
 *               choices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The updated list of possible answers
 *     responses:
 *       '200':
 *         description: Quiz updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Quiz updated successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       '404':
 *         description: Quiz not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Quiz not found
 */
quizRouter.put("/admin/update", async (req, res) => {
  try {
    const { id, question, practice_id, answer_key, choices } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: "Quiz ID is required in the request body",
      });
    }

    const { data, error } = await db
      .from("m_quiz")
      .update({ question, practice_id, answer_key, choices })
      .match({ quiz_id: id })
      .select("*");

    if (error) {
      throw error;
    }

    // If no data is returned (i.e., quiz not found), return a 404 error
    if (data.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Quiz not found",
      });
    }

    // Return the updated data
    return res.status(200).json({
      status: 200,
      message: "Quiz updated successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /api/quiz/admin/delete/{quiz_id}:
 *   delete:
 *     summary: Delete a quiz
 *     description: Remove a quiz from the database by its ID.
 *     tags:
 *       - Quiz
 *     parameters:
 *       - in: path
 *         name: quiz_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the quiz to delete
 *     responses:
 *       '200':
 *         description: Quiz deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Quiz deleted successfully
 *       '400':
 *         description: Quiz ID is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Quiz ID is required
 */
quizRouter.delete("/admin/delete/:quiz_id", async (req, res) => {
  try {
    const { quiz_id } = req.params;

    if (!quiz_id) {
      return res.status(400).json({
        status: 400,
        message: "Quiz ID is required",
      });
    }

    const { error } = await db.from("m_quiz").delete().eq("quiz_id", quiz_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Quiz deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

export default quizRouter;
