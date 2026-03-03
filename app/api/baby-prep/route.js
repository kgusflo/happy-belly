import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  const { meal, babyMonths } = await request.json();

  let stage;
  if (!babyMonths || babyMonths < 5) {
    stage = 'not yet ready for solids (under 5 months) — breast milk or formula only';
  } else if (babyMonths < 8) {
    stage = `${babyMonths} months — starting solids. Smooth single-ingredient purees only`;
  } else if (babyMonths < 10) {
    stage = `${babyMonths} months — exploring textures. Soft mashed foods and soft finger foods`;
  } else if (babyMonths < 12) {
    stage = `${babyMonths} months — table foods stage. Soft chopped pieces, variety of textures`;
  } else {
    stage = `${babyMonths} months — toddler eating. Most family foods cut into small soft pieces`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [
        {
          role: 'user',
          content: `The family is having: "${meal}"

Baby is ${babyMonths ? `${babyMonths} months old` : 'an infant'} (${stage}).

Give 3-4 short, practical bullet points explaining how to prepare or adapt this meal specifically for the baby at their developmental stage. Be specific about textures, portions, and any ingredients to avoid. No markdown headers or bold text. Use • for bullets. Keep it concise.`,
        },
      ],
    });

    return Response.json({ instructions: message.content[0].text });
  } catch (error) {
    console.error('Baby prep API error:', error);
    return Response.json({ instructions: 'Could not generate instructions. Please try again.' }, { status: 500 });
  }
}
