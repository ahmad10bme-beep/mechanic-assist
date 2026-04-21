require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');

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

function correctSpelling(text) {
  let corrected = text;
  
  // تصحيح أخطاء شائعة
  corrected = corrected.replace(/تايوتا|تويتا/g, 'تويوتا');
  corrected = corrected.replace(/أكورد|اكورد/g, 'Honda Accord');
  
  return corrected;
}

// Search Wikimedia Commons for REAL car part images (FREE - no API key needed!)
async function searchRealImage(query) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' car part')}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.query?.search?.length) return null;
    
    // Try each result until we find one with a valid image
    for (const result of searchData.query.search) {
      const title = result.title;
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=800&format=json&origin=*`;
      const infoRes = await fetch(imageInfoUrl);
      const infoData = await infoRes.json();
      const pages = infoData.query?.pages;
      if (!pages) continue;
      
      const page = Object.values(pages)[0];
      if (page.imageinfo?.[0]?.thumburl) {
        return {
          url: page.imageinfo[0].thumburl,
          source: 'real',
          title: title
        };
      }
    }
    return null;
  } catch (e) {
    console.log('Real image search failed:', e.message);
    return null;
  }
}

app.post('/image', async (req, res) => {
  console.log('=== /image endpoint hit ===');
  console.log('Received /image request:', req.body);
  try {
    const { prompt, carMake, carModel, carYear, partName } = req.body;
    console.log('Original prompt:', prompt);

    const correctedPrompt = correctSpelling(prompt);
    console.log('Corrected prompt:', correctedPrompt);

    // STEP 1: Try to find a REAL image from Wikimedia Commons (FREE!)
    const searchTerms = [
      `${carMake || ''} ${carModel || ''} ${partName || ''}`.trim(),
      `${partName || ''} car ${carMake || ''}`.trim(),
      `${partName || ''} automotive`.trim(),
      correctedPrompt
    ];
    
    let realImage = null;
    for (const term of searchTerms) {
      if (term.length < 3) continue;
      realImage = await searchRealImage(term);
      if (realImage) {
        console.log('Found REAL image:', realImage.url);
        break;
      }
    }

    if (realImage) {
      return res.json({ 
        imageUrl: realImage.url, 
        source: 'real',
        title: realImage.title
      });
    }

    // STEP 2: Fallback to DALL-E 3 (much better than DALL-E 2!)
    console.log('No real image found, using DALL-E 3...');
    
    const styledPrompt = `A highly detailed, photorealistic image of ${correctedPrompt}, showing the exact specific car part clearly and accurately. The image should look like a professional auto parts catalog photograph. Clean background, proper lighting, all details visible and anatomically correct. No text, no labels, no watermarks.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: styledPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    console.log('DALL-E 3 image generated successfully');
    res.json({ 
      imageUrl: response.data[0].url,
      source: 'ai'
    });
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