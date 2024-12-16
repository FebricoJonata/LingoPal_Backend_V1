import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./helpers/middleware.js";

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
 *         name: search
 *         schema:
 *           search: string
 *         description: Filter material by search
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

materialResourceRouter.post("/admin/create", async (req, res) => {
  try {
    const { title, type, category, source, cover, content, description } =
      req.body;

    const { data, error } = await db
      .from("m_material_resource")
      .insert([{ title, type, category, source, cover, content, description }])
      .select("*");

    if (error) {
      throw error;
    }

    return res.status(200).json({
      status: 200,
      message: "New material created successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

materialResourceRouter.put("/admin/update", async (req, res) => {
  try {
    const { id, title, type, category, source, cover, content, description } =
      req.body;

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: "ID is required in the request body",
      });
    }

    const { data, error } = await db
      .from("m_material_resource")
      .update({ title, type, category, source, cover, content, description })
      .match({ id: id })
      .select("*");

    if (error) {
      throw error;
    }

    // If no data is returned
    if (data.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    // Return the updated data
    return res.status(200).json({
      status: 200,
      message: "New material updated successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

materialResourceRouter.delete("/admin/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: "ID is required",
      });
    }

    const { error } = await db
      .from("m_material_resource")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Material deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

export default materialResourceRouter;
