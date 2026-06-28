import express, { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Authenticate all requests using our JWT middleware
router.use(authMiddleware);

router.post('/scan-receipt', async (req: AuthRequest, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    // Retrieve Gemini API Key from request headers (BYOK) or fallback to server env key
    const clientKey = req.headers['x-gemini-key'] as string;
    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API Key is missing. Please add a key in Profile Settings or verify backend configuration.',
      });
    }

    // Strip out base64 header if it exists
    let base64Data = image;
    let mimeType = 'image/jpeg';
    
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    // Initialize Google Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We can use gemini-1.5-flash as the standard fast, multimodal model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a receipt scanning assistant. Analyze this receipt image and extract:
1. Merchant name (under "merchant")
2. Date of the transaction (under "date", format as YYYY-MM-DD or null if not found)
3. List of items (under "items"), where each item contains:
   - "name": string (clean name of the item)
   - "quantity": number (default to 1 if not specified)
   - "price": number (price per single unit, or total item cost divided by quantity)
4. Taxes (under "taxes", total tax amount, default to 0 if not found)
5. Total bill amount (under "total", default to 0 if not found)

Provide the output ONLY as a JSON object matching this schema:
{
  "merchant": string,
  "date": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "price": number
    }
  ],
  "taxes": number,
  "total": number
}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    
    if (!responseText) {
      return res.status(500).json({ error: 'Empty response from Gemini AI' });
    }

    // Parse structured JSON returned by Gemini
    const receiptData = JSON.parse(responseText);

    res.json({
      success: true,
      data: receiptData,
    });
  } catch (error: any) {
    console.error('Error scanning receipt with Gemini:', error);
    
    // Handle standard Google API key errors elegantly
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({ error: 'Invalid Gemini API key. Please check your settings.' });
    }

    res.status(500).json({
      error: error.message || 'Failed to scan receipt. Please verify image clarity and try again.',
    });
  }
});

export default router;
