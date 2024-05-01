import express from "express";
import { config as dotenvConfig } from "dotenv";
import axios from "axios";
import fs from "fs";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import _ from "lodash";
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
 *         description: Audio file generated from the text.
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
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
      responseType: "stream",
    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "attachment",
    });

    // Forward the response directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware to parse binary request body
speechAzureRouter.use(express.raw({ limit: "50mb", type: "audio/wave" }));

speechAzureRouter.post("/speech-to-text", async (req, res) => {
  try {
    const audioData = req.body; // Assuming binary audio data is provided directly in the request body
    const subscriptionKey = process.env.SPEECH_KEY; // Your Azure Cognitive Services subscription key
    const region = "eastasia";

    pronunciationAssessmentContinuousWithFile(req.body);
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

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//pronunciationAssessmentContinuousWithFile using microsoft Machine Learning SDK
const pronunciationAssessmentContinuousWithFile = (wavData) => {
  const audioConfig = sdk.AudioConfig.fromWavFileInput(wavData);
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY,
    "eastasia"
  );

  const reference_text = "this a test response API";
  const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
    reference_text,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  pronunciationAssessmentConfig.enableProsodyAssessment = true;

  const language = "en-US";
  speechConfig.speechRecognitionLanguage = language;

  const reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  pronunciationAssessmentConfig.applyTo(reco);

  reco.recognizing = function (s, e) {
    console.log(
      "(recognizing) Reason: " +
        sdk.ResultReason[e.result.reason] +
        " Text: " +
        e.result.text
    );
  };

  reco.recognized = function (s, e) {
    console.log("pronunciation assessment for: ", e.result.text);
    const pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(
      e.result
    );
    console.log(
      " Accuracy score: ",
      pronunciation_result.accuracyScore,
      "\n",
      "pronunciation score: ",
      pronunciation_result.pronunciationScore,
      "\n",
      "completeness score : ",
      pronunciation_result.completenessScore,
      "\n",
      "fluency score: ",
      pronunciation_result.fluencyScore
    );

    // Your logic for scoring system here
  };

  reco.canceled = function (s, e) {
    if (e.reason === sdk.CancellationReason.Error) {
      console.log(
        "(cancel) Reason: " +
          sdk.CancellationReason[e.reason] +
          ": " +
          e.errorDetails
      );
    }
    reco.stopContinuousRecognitionAsync();
  };

  reco.sessionStarted = function (s, e) {};

  reco.sessionStopped = function (s, e) {
    reco.stopContinuousRecognitionAsync();
    reco.close();
    // Calculate and handle scores here
  };

  reco.startContinuousRecognitionAsync();
};

export default speechAzureRouter;
