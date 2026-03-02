import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { images } = await request.json();

    if (!images || images.length === 0) {
      return Response.json({ error: 'No images provided' }, { status: 400 });
    }

    // Build the message content — all images first, then the instruction
    const content = [
      ...images.map(img => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.data,
        },
      })),
      {
        type: 'text',
        text: `These are ${images.length > 1 ? `${images.length} photos of a recipe` : 'a photo of a recipe'}. ${images.length > 1 ? 'The photos may show different parts of the same recipe — combine them into one complete recipe.' : ''}

Extract the recipe and return ONLY a valid JSON object with this exact format:
{
  "name": "Recipe name",
  "ingredients": "ingredient 1\\ningredient 2\\ningredient 3",
  "instructions": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "notes": "Any tips, serving suggestions, or notes (leave empty string if none)",
  "prep_time": "e.g. 30 mins (leave empty string if not shown)"
}

Rules:
- ingredients: each ingredient on its own line, include quantities
- instructions: each step on its own line starting with "Step N:"
- If the same ingredient appears in multiple photos, only include it once
- If instructions span multiple photos, combine them in order
- Return ONLY the JSON, no other text`,
      },
    ];

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });

    const raw = message.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const recipe = JSON.parse(raw);

    return Response.json({ recipe });
  } catch (error) {
    console.error('Photo extract error:', error);
    return Response.json({ error: 'Could not extract recipe from photo. Please try again.' }, { status: 500 });
  }
}
