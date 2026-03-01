import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { url } = await request.json();

    const response = await fetch(url);
    const html = await response.text();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Extract the recipe from this HTML and return it as JSON with these exact fields:
{
  "name": "recipe name",
  "protein_source": "main protein (e.g. Chicken, Salmon, Lentils, Beef)",
  "ingredients": "all ingredients, one per line",
  "instructions": "step by step instructions",
  "prep_time": "total time as a string e.g. 30 mins",
  "notes": ""
}

Only return the JSON, nothing else.

HTML:
${html.slice(0, 15000)}`
      }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const recipe = JSON.parse(jsonMatch[0]);

    return Response.json({ recipe });
  } catch (error) {
    console.error('Fetch recipe error:', error);
    return Response.json({ error: 'Could not fetch recipe' }, { status: 500 });
  }
}
