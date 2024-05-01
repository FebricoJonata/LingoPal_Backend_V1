// import express from "express";
// import { config as dotenvConfig } from "dotenv";
// import { Configuration, OpenAIApi } from "openai";

// dotenvConfig();

// const openAIRouter = express.Router();

// const configuration = new Configuration({
//   apiKey: process.env.OPEN_AI_KEY,
// });
// const openai = new OpenAIApi(configuration);

// openAIRouter.post("/chat", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     const response = await openai.createCompletion({
//       model: "babbage-002",
//       prompt: `${prompt}`,
//     });

//     return res.status(200).json({
//       success: true,
//       data: response.data.choices[0].text,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       error: error.response
//         ? error.response.data
//         : "There was an issue on the server",
//     });
//   }
// });

// export default openAIRouter;
