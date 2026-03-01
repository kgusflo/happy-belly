import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { ingredients, instructions } = await request.json();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Based on these ingredients and instructions, give a brief nutritional profile for this recipe. Include approximate calories per serving, protein, carbs, fats, and any notable vitamins or minerals. Keep it concise - 3 to 5 lines max.

Ingredients:
${ingredients}

Instructions:
${instructions || 'Not provided'}`
      }]
    });

    return Response.json({ nutrition: message.content[0].text });
  } catch (error) {
    console.error('Nutrition analysis error:', error);
    return Response.json({ error: 'Could not analyze nutrition' }, { status: 500 });
  }
}
