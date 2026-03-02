import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const client = new Anthropic();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FAMILY_PROFILES = `
Family Nutrition Profiles:

MOM:
- Height/Weight: 5'9", 175 lbs
- Status: 5.5 months postpartum, not breastfeeding
- Activity: Returning to sand volleyball, strong athletic background
- Protein target: 140-165g per day
- Supplements: women's multivitamin, vitamin D, omega-3, magnesium, vitamin C, hydration tablets
- Goals: Restore athletic body composition, support postpartum recovery

DAD:
- Height: 6'5", athletic build, strength training
- Needs: High protein, higher carbs for training fuel
- Supplements: omega-3, magnesium, vitamin D, creatine

BABY (~6 months):
- Just starting solids
- Priority: Iron-rich foods
- Preparation: Pureed smooth or soft enough to squish between fingers

COOKING PHILOSOPHY:
- Simple, low-effort meals
- Batch cooking friendly
- Same ingredients for whole family, just prepared differently for baby
`;

export async function POST(request) {
  try {
    const { type, mealPlan, weeklyContext } = await request.json();

    let prompt;

    if (type === 'meal-plan') {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('name, protein_source, prep_time, batch_friendly, baby_adaptable, one_pan, use_count')
        .order('use_count', { ascending: false });

      const recipeList = recipes && recipes.length > 0
        ? `\nSAVED RECIPES IN HER LIBRARY:\n${recipes.map(r =>
            `- ${r.name}${r.protein_source ? ` (${r.protein_source})` : ''}${r.prep_time ? ` | ${r.prep_time}` : ''}${r.batch_friendly ? ' | batch-friendly' : ''}${r.baby_adaptable ? ' | baby-adaptable' : ''}${r.one_pan ? ' | one-pan' : ''}`
          ).join('\n')}`
        : '';

      prompt = `${FAMILY_PROFILES}${recipeList}

Create a 7-day meal plan for this family. Prioritize using recipes from her saved library when possible. For each day include breakfast, lunch, dinner, and 1-2 snacks.

Format each day like this:
**Monday**
- Breakfast: [meal]
- Lunch: [meal]
- Dinner: [meal]
- Snacks: [snack ideas]
- Baby's portions: [how to prepare for baby]

Keep meals simple and practical. Prioritize iron-rich foods, protein, and foods that work for the whole family.

${weeklyContext ? `This week's context from the user: ${weeklyContext}` : ''}`;
    } else if (type === 'swap-meal') {
      prompt = `${FAMILY_PROFILES}

Current meal plan for context:
${mealPlan}

Generate a different ${mealType} option for ${day}. The current ${mealType} is: "${currentMeal}".
Make it different but equally practical and nutritious. Return ONLY the new meal description in one line, nothing else.`;


    } else if (type === 'grocery-list') {
      prompt = `Based on this weekly meal plan:\n\n${mealPlan}\n\nCreate a grocery list organized by store section. Return ONLY a valid JSON array, no other text. Format:
[
  { "category": "Produce", "items": ["apples (3)", "spinach (1 bag)"] },
  { "category": "Protein", "items": ["chicken breast (2 lbs)"] },
  { "category": "Dairy", "items": ["Greek yogurt (32 oz)"] },
  { "category": "Pantry & Dry Goods", "items": ["olive oil", "brown rice (2 cups)"] },
  { "category": "Frozen", "items": ["edamame (1 bag)"] }
]
Include quantities for 2 adults only. Do not include baby portions or notes in the grocery list.`;
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    return Response.json({ result: message.content[0].text });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
