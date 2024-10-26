import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenvConfig();
const materialResourceRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @swagger
 * /api/material-resource:
 *   get:
 *     summary: Retrieve a list of materials resource
 *     description: Retrieve a list of materials resource from the database.
 *     tags:
 *      - Material Resource
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter material by type
 *       - in: query
 *         name: seaarch
 *         schema:
 *           seaarch: string
 *         description: Filter material by seaarch
 *     responses:
 *       '200':
 *         description: A JSON array of materials resource.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
materialResourceRouter.get("/", async (req, res) => {
  try {
    const { type, search } = req.query;

    const query = db.from("m_material_resource").select("*");

    if (type) {
      query.eq("type", type);
    }

    if (search) {
      query.like("title", `%${search}%`);
    }

    // Execute the query
    const { data } = await query;

    return res.status(200).json({
      status: 200,
      body: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Internal server error",
    });
  }
});

export default materialResourceRouter;
