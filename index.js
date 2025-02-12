import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import bodyParser from "body-parser";

// Import the router
import usersRouter from "./src/Routes/users.js";
import helloRouter from "./src/hello.js";
import speechAzureRouter from "./src/Routes/speechAzure.js";
import courseRouter from "./src/Routes/course.js";
import practiceRouter from "./src/Routes/practice.js";
import quizRouter from "./src/Routes/quiz.js";
import wordsRouter from "./src/Routes/word.js";
import groqRouter from "./src/Routes/groq.js";
import materialResourceRouter from "./src/Routes/materialResource.js";
import emailRouter from "./src/Routes/mail.js";

// CDN CSS
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

const app = express();

app.use(bodyParser.json()); // to use body object in requests
const PORT = process.env.PORT || 2001;
dotenv.config();

app.use(morgan("dev"));
app.use(cors());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LingoPal API",
      version: "1.0.0",
      description: "Express LingoPal API",
    },
    servers: [
      { url: "http://localhost:7700", description: "Local" },
      { url: "https://lingo-pal-backend-v1.vercel.app", description: "Cloud" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // Optional: to specify the token type
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Apply globally if required
      },
    ],
  },
  apis: ["src/**/*.js"], // Paths to your endpoint files
};

const specs = swaggerJsDoc(options);

app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(specs, { customCssUrl: CSS_URL })
);

app.use("/", helloRouter);
app.use("/api/users", usersRouter);
app.use("/api/speech", speechAzureRouter);
app.use("/api/course", courseRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/word", wordsRouter);
app.use("/api/chat", groqRouter);
app.use("/api/material-resource", materialResourceRouter);
app.use("/api/mail", emailRouter);

app.listen(PORT, () => console.log(`Server runs on port ${PORT}`));
