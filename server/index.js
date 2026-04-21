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

function correctSpelling(text) {
  let corrected = text;
  
  // تصحيح أخطاء شائعة
  corrected = corrected.replace(/تايوتا|تويتا/g, 'تويوتا');
  corrected = corrected.replace(/أكورد|اكورد/g, 'Honda Accord');
  
  return corrected;
}

// Expand simple part names to accurate technical descriptions
async function expandPartName(partName) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert automotive parts catalog specialist. Your job is to translate ANY car part name (in any language) to the EXACT English technical OEM automotive term.

Examples of correct translations:
- "فرامل" → "disc brake caliper assembly"
- "بواجي" → "spark plug"
- "كرسي مكينة" → "engine motor mount"
- "رديتر" → "radiator cooling unit"
- "تيل فرامل" → "brake pad set"
- "صوفة مكينة" → "engine cylinder head gasket"
- "كويل" → "ignition coil"
- "دينمو" → "alternator generator"
- "سلف" → "starter motor"
- "قطع غيار تويوتا كامري" → "Toyota Camry brake caliper"

Rules:
1. Identify the EXACT specific part, not generic category
2. Include the specific component type (disc/drum/caliper/pad/rotor)
3. Use standard OEM catalog terminology
4. If user mentions car brand/model, include it for accuracy
5. Respond with ONLY the technical term, nothing else
6. Maximum 10 words` 
        },
        { role: 'user', content: `Part name: "${partName}"

Provide the exact English technical automotive term:` }
      ],
      max_tokens: 50,
      temperature: 0
    });
    const expanded = completion.choices[0].message.content.trim();
    console.log('Expanded part name:', partName, '->', expanded);
    return expanded;
  } catch (e) {
    console.log('Part name expansion failed, using original:', e.message);
    return partName;
  }
}

app.post('/image', async (req, res) => {
  console.log('=== /image endpoint hit ===');
  console.log('Received /image request:', req.body);
  try {
    const { partName } = req.body;
    if (!partName || partName.trim().length < 2) {
      return res.status(400).json({ error: 'يرجى إدخال اسم القطعة' });
    }

    // STEP 1: Expand simple names to technical terms for accuracy
    const technicalPartName = await expandPartName(partName.trim());
    
    // STEP 2: Generate precise technical drawing with DALL-E 3
    console.log('Generating technical drawing for:', technicalPartName);
    
    const styledPrompt = `A clean, precise black and white technical illustration of an automotive ${technicalPartName}, completely isolated on a pure white background. The drawing shows ONLY this single specific car part with all its identifying mechanical details: mounting points, threads, connectors, seals, grooves, and structural features accurately depicted. Clean engineering line art with fine hatching and cross-hatching for depth and dimension. No color, no gradients, no shadows, no background elements, no text, no labels, no watermarks, no random extra parts, no hands, no tools, no people. Professional factory OEM parts catalog technical schematic style. The part is centered, shown from a clear three-quarter or side view that best reveals its complete form and all functional details.`;
    
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
      source: 'ai',
      partName: technicalPartName
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