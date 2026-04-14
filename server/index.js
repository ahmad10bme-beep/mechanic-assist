require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();

// هذا السطر هو السر: يسمح لأي جوال من أي شبكة بالاتصال بسيرفرك
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
  res.send('Server is Running - Ahmad Alzahrani');
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "أنت خبير ميكانيكا سيارات خبير ومساعد للمبتكر أحمد الزهراني." },
        { role: "user", content: message }
      ],
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "خطأ في الاتصال" });
  }
});

app.post('/image', async (req, res) => {
  console.log('=== /image endpoint hit ===');
  console.log('Received /image request:', req.body);
  try {
    const { prompt } = req.body;
    console.log('Original prompt:', prompt);

const styledPrompt = `A extremely detailed, totally isolated technical schematic line drawing illustration of ${prompt}, showing ONLY the specific part and its internal mechanics, black and white line art style, intricate stippling and cross-hatching shading, identical in style to image_6.png, on a plain, pure white background. CRITICAL: Do NOT show the complete car, car body, wheels, windows, or any other unrelated vehicle parts. Focus solely on the isolated ${prompt}.`;
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: styledPrompt,
      n: 1,
      size: "512x512",
    });
    console.log('Image generated successfully');
    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Image generation error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: "خطأ في توليد الصورة: " + error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});