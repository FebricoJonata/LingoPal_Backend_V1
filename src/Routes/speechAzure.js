import express from "express";
import { config as dotenvConfig } from "dotenv";
import axios from "axios";
import fs from "fs";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import _ from "lodash";
import ffmpeg from "fluent-ffmpeg";
dotenvConfig();

const speechAzureRouter = express.Router();

/**
 * @swagger
 * /api/speech/text-to-speech:
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
 *         description: Audio file generated from the text in Base64 format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audioContent:
 *                   type: string
 *                   format: base64
 *                   description: Base64 encoded audio content.
 */
speechAzureRouter.post("/text-to-speech", async (req, res) => {
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
      responseType: "arraybuffer",
    });

    const audioBuffer = Buffer.from(response.data, "binary");
    const audioBase64 = audioBuffer.toString("base64");

    res.json({ audioContent: audioBase64 });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware to parse binary request body
speechAzureRouter.use(express.raw({ limit: "100mb", type: "audio/wave" }));

speechAzureRouter.post("/speech-to-text", async (req, res) => {
  try {
    const audioData = req.body; // Assuming binary audio data is provided directly in the request body
    const subscriptionKey = process.env.SPEECH_KEY; // Your Azure Cognitive Services subscription key
    const region = "eastasia";

    // Perform speech recognition
    const response = await axios.post(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
      audioData,
      {
        headers: {
          "Content-Type": "audio/wave",
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    const buffer = Buffer.isBuffer(audioData)
      ? audioData
      : Buffer.from(audioData);

    console.log(buffer);

    // Perform pronunciation assessment
    const pronunciationScores = await pronunciationAssessmentContinuousWithFile(
      buffer
    );

    // Combine speech recognition result with pronunciation scores
    const result = {
      recognition: response.data,
      pronunciationScores,
    };

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Pronunciation Assessment using Microsoft Machine Learning SDK
const pronunciationAssessmentContinuousWithFile = async (wavData) => {
  return new Promise((resolve, reject) => {
    const audioConfig = sdk.AudioConfig.fromWavFileInput(wavData);
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY,
      "eastasia"
    );

    const referenceText = "It's a sunny day";
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    pronunciationAssessmentConfig.enableProsodyAssessment = true;

    speechConfig.speechRecognitionLanguage = "en-US";

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        const pronunciationResult =
          sdk.PronunciationAssessmentResult.fromResult(e.result);
        const scores = {
          accuracyScore: pronunciationResult.accuracyScore,
          pronunciationScore: pronunciationResult.pronunciationScore,
          completenessScore: pronunciationResult.completenessScore,
          fluencyScore: pronunciationResult.fluencyScore,
        };
        resolve(scores);
      } else {
        reject(new Error("Speech not recognized"));
      }
    };

    recognizer.canceled = (s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        reject(new Error(`CancellationReason: ${e.errorDetails}`));
      }
      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
      recognizer.stopContinuousRecognitionAsync();
      recognizer.close();
    };

    recognizer.startContinuousRecognitionAsync();
  });
};

export default speechAzureRouter;
