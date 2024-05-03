import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenvConfig();
const usersRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users or search users by email
 *     description: Retrieve a list of users from the Supabase database or search users by email.
 *     tags:
 *      - Users
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter users by email address
 *     responses:
 *       '200':
 *         description: A JSON array of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
usersRouter.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    let fetchUsers;

    if (email) {
      fetchUsers = await db
        .from("m_users")
        .select("user_id, name, email, phone_number, birth_date, gender, image")
        .eq("email", email);
    } else {
      fetchUsers = await db
        .from("m_users")
        .select(
          "user_id, name, email, phone_number, birth_date, gender, image"
        );
    }

    return res.status(200).json({
      status: 200,
      body: fetchUsers,
    });
  } catch (error) {
    console.error("Error retrieving users:", error.message);
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
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
 *               birth_date:
 *                 type: string
 *               gender:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - password
 *               - birth_date
 *               - gender
 *     responses:
 *       '200':
 *         description: User signed up successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Invalid request or user already exists.
 *       '500':
 *         description: Internal server error.
 */
usersRouter.post("/signup", async (req, res) => {
  const { name, email, password, phone_number, birth_date, gender } = req.body;

  try {
    // Check if the user already exists
    const { data: existingUsers } = await db
      .from("m_users")
      .select("*")
      .eq("email", email);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into Supabase users table
    const { data: newUser } = await db
      .from("m_users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone_number,
          birth_date,
          gender,
        },
      ])
      .select("id, name, email, phone_number, birth_date, gender, image");

    return res
      .status(200)
      .json({ message: "User signed up successfully.", data: newUser });
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
    // Fetch user data from Supabase table
    const { data: users, error } = await db
      .from("m_users")
      .select(
        "id, name, email, phone_number, birth_date, gender, password, image"
      )
      .eq("email", email)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res
        .status(401)
        .json({ error: "Unauthorized, incorrect email or password." });
    }

    const user = users[0];

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Unauthorized, incorrect email or password." });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "36h",
    });

    // Return user data and JWT token
    return res.status(200).json({
      message: "User signed in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        birth_date: user.birth_date,
        gender: user.gender,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.error("Error signing in user:", error.message);
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
    const { error } = await db.from("m_users").delete().eq("id", userId);

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
