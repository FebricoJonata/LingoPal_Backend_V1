import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenvConfig();
const usersRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Retrieve a list of users from the Supabase database.
 *     tags:
 *      - Users
 *     responses:
 *       '200':
 *         description: A JSON array of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The user ID.
 *                   name:
 *                     type: string
 *                     description: The user's name.
 *                   email:
 *                     type: string
 *                     description: The user's email address.
 */

usersRouter.get("/", async (req, res) => {
  const fetchUsers = await db.from("users").select();
  return res.status(200).json({
    status: 200,
    body: fetchUsers,
  });
});

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Sign up a new user
 *     description: Register a new user in the Supabase database and authentication system.
 *     tags:
 *       - Users
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone_number:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: User signed up successfully.
 *       '400':
 *         description: Invalid request or user already exists.
 *       '500':
 *         description: Internal server error.
 */

// Signup function with phone number handling
usersRouter.post("/signup", async (req, res) => {
  const { name, email, password, phone_number } = req.body;

  try {
    // Check if the user already exists
    const { data: existingUsers, error: existingUsersError } = await db
      .from("users")
      .select("*")
      .eq("email", email);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Sign up the user with authentication
    const { user, error: authError } = await db.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw authError;
    }

    // Insert new user into Supabase users table
    const { data: newUser, error: dbError } = await db
      .from("users")
      .insert([{ name, email, phone_number }]);

    if (dbError) {
      throw dbError;
    }

    return res.status(200).json({ message: "User signed up successfully." });
  } catch (error) {
    console.error("Error signing up user:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * @swagger
 * /api/users/signin:
 *   post:
 *     summary: Sign in a user
 *     description: Authenticate a user in the Supabase authentication system.
 *     tags:
 *       - Users
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: User signed in successfully.
 *       '401':
 *         description: Unauthorized, incorrect email or password.
 *       '500':
 *         description: Internal server error.
 */
usersRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Sign in the user with Supabase authentication
    const { user, session, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res
        .status(401)
        .json({ error: "Unauthorized, incorrect email or password." });
    }

    return res
      .status(200)
      .json({ message: "User signed in successfully.", user, session });
  } catch (error) {
    console.error("Error signing in user:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout a user
 *     description: End the user's session in the Supabase authentication system.
 *     tags:
 *       - Users
 *     responses:
 *       '200':
 *         description: User logged out successfully.
 *       '500':
 *         description: Internal server error.
 */
usersRouter.post("/logout", async (req, res) => {
  try {
    // Sign out the user from Supabase
    const { error } = await db.auth.signOut();

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: "User logged out successfully." });
  } catch (error) {
    console.error("Error logging out user:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user from the Supabase database by ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User deleted successfully.
 *       '404':
 *         description: User not found.
 *       '500':
 *         description: Internal server error.
 */
usersRouter.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete the user from the Supabase database
    const { error } = await db.from("users").delete().eq("id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default usersRouter;
