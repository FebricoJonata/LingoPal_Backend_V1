import express from "express";
import { config as dotenvConfig } from "dotenv";
import axios from "axios";
dotenvConfig();

const speechAzureRouter = express.Router();

/**
 * @swagger
 * /api/speech/tts:
 *   post:
 *     summary: Convert text to speech
 *     description: Convert text to speech using Azure Speech service.
 *     tags:
 *       - Speech
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to be converted to speech.
 *             required:
 *               - text
 *     responses:
 *       '200':
 *         description: Audio file generated from the text.
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 */
speechAzureRouter.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    const speechEndpoint = `https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1`;
    const xmlData = `
              <speak version='1.0' xml:lang='en-US'>
                  <voice xml:lang='en-US' xml:gender='Female' name='en-US-AvaMultilingualNeural'>
                      ${text}
                  </voice>
              </speak>
            `;

    const response = await axios.post(speechEndpoint, xmlData, {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "curl",
      },
      responseType: "stream",
    });

    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": "attachment",
    });

    // Forward the response directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default speechAzureRouter;
