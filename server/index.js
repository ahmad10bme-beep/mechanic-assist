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
// Tries multiple search strategies for maximum accuracy
async function searchRealImage(queries) {
  for (const query of queries) {
    if (!query || query.length < 3) continue;
    
    try {
      console.log('Searching Wikimedia for:', query);
      
      // Strategy 1: Direct image search in File namespace
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (searchData.query?.search?.length) {
        // Get image info for ALL results at once (more efficient)
        const titles = searchData.query.search.map(r => r.title).join('|');
        const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|thumburl|mime&iiurlwidth=800&format=json&origin=*`;
        const infoRes = await fetch(imageInfoUrl);
        const infoData = await infoRes.json();
        
        if (infoData.query?.pages) {
          for (const page of Object.values(infoData.query.pages)) {
            // Only accept actual image files (not SVG diagrams)
            const mime = page.imageinfo?.[0]?.mime || '';
            const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
            
            if (url && (mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime === '')) {
              // Skip very small images (likely icons or diagrams)
              const width = page.imageinfo?.[0]?.width || 800;
              if (width >= 300) {
                console.log('Found REAL image:', url);
                return {
                  url: url,
                  source: 'real',
                  title: page.title
                };
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('Search failed for query "' + query + '":', e.message);
    }
  }
  return null;
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
      `${carMake || ''} ${partName || ''}`.trim(),
      partName || '',
      correctedPrompt
    ].filter(t => t && t.length >= 3); // Remove empty/short terms
    
    console.log('Searching with terms:', searchTerms);
    const realImage = await searchRealImage(searchTerms);

    if (realImage) {
      return res.json({ 
        imageUrl: realImage.url, 
        source: 'real',
        title: realImage.title
      });
    }

    // STEP 2: Fallback to DALL-E 3 (much better than DALL-E 2!)
    console.log('No real image found, using DALL-E 3...');
    
    const styledPrompt = `A precise black and white technical line drawing illustration of ${correctedPrompt}, completely isolated on a pure white background. The drawing shows ONLY the exact specific part with accurate proportions, mounting points, threads, and mechanical details. Clean vector-style line art with fine cross-hatching and stippling shading for depth. No color, no gradients, no background elements, no text, no labels, no watermarks, no random extra parts. Identical style to a factory service manual technical schematic.`;
    
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