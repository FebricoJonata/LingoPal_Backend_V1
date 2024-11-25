import { Groq } from "groq-sdk";
import { config as dotenvConfig } from "dotenv";
import express from "express";
import { verifyToken } from "./helpers/middleware.js";

dotenvConfig();

const groqRouter = express.Router();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let conversationHistory = [];

groqRouter.post("/chat-completion", verifyToken, async (req, res) => {
  try {
    const { conversation } = req.body;

    // Ensure conversation is an array
    const messages = Array.isArray(conversation)
      ? conversation
      : [conversation];

    // Add current conversation to history
    conversationHistory = [...conversationHistory, ...messages];

    const chatCompletion = await getGroqChatCompletion(conversationHistory);

    res.json({ message: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Error" + error);
    res.status(500).send({ error: "An error occurred" });
  }
});

async function getGroqChatCompletion(conversation) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You're english assistant that help users to learn english using conversation. So, your first response to user is to start conversation directly about daily activity. Your name is Lingo. ",
      },
      {
        role: "system",
        content:
          "Lingo, as english assistant you need to give your user warm welcoming as possible if they start to interact with you",
      },
      {
        role: "system",
        content:
          "Lingo, as english assistant you dont need to response any unrelated conversation beside help users to improve their english and you can really reject to answer them if they ask unrelated question like solving/giving them snippet code.",
      },
      {
        role: "system",
        content:
          "Lingo, as english assistant you can to rate users english skill by conversation your had from scale 1-100. Give disclamer that your judgement is not really describe user's real skill. Finally say thank you! you can say it if user say 'Stop Conversation' ",
      },
      ...conversation,
    ],
    model: "llama3-70b-8192",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 0.5,
    // stream: true,
    // stop: null,
  });
}

export default groqRouter;

// Sample Conversation
// {
//     "conversation": [
//       {
//         "role": "user",
//         "content": "Hi Daniella, can you give snippet code for flutter rest api?"
//       },
//       {
//         "role": "user",
//         "content": "Hi Daniella, let's our conversation?"
//       },
//       {
//           "role" : "assistant",
//           "content" : "Hi there! I'm Daniella, your English assistant. I'd be delighted to chat with you and help you improve your English skills. How about we start with something simple? What did you do today? Did you do anything exciting or interesting?"
//       },
//       {
//         "role": "user",
//         "content": "Nice to meet you Daniella! I just working as internship on a corporate company and that's really fun today!"
//       },
//       {
//           "role" : "user",
//           "content" : "Daniella, Stop Conversation! rate my english"
//       }
//     ]
//   }

// Final result
// {
//     "message": "It was nice chatting with you!\n\nAs your English assistant, I'd rate your English skills as 60 out of 100. You did a great job expressing yourself, but there were a few areas where you could improve. For example, you could work on using more complex sentence structures and vocabulary.\n\nDon't worry, though - practice makes perfect! Keep chatting with me, and I'll be happy to help you improve your English skills.\n\nThanks for chatting with me, and I hope to see you again soon!"
// }
