import express from "express";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenvConfig();
const commonRouter = express.Router();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
