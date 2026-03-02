import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const client = new Anthropic();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fallback profiles if no family members are saved yet
const FAMILY_PROFILES_FALLBACK = `
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

const buildFamilyProfiles = (members) => {
  if (!members || members.length === 0) return FAMILY_PROFILES_FALLBACK;

  const lines = ['Family Nutrition Profiles:\n'];

  for (const m of members) {
    lines.push(`${(m.name || 'Member').toUpperCase()}:`);

    if (m.date_of_birth) {
      const months = Math.floor((new Date() - new Date(m.date_of_birth)) / (1000 * 60 * 60 * 24 * 30.44));
      if (months < 36) {
        lines.push(`- Age: ${months} months old`);
        if (months < 5) lines.push('- Diet: Breast milk or formula only — not ready for solids');
        else if (months < 8) lines.push('- Solids stage: Starting solids — smooth purees, single ingredients, prioritize iron-rich foods');
        else if (months < 10) lines.push('- Solids stage: Soft mashed foods, soft finger foods');
        else if (months < 12) lines.push('- Solids stage: Soft chopped table food, variety of textures');
        else lines.push('- Solids stage: Table foods, wide variety of textures');
      } else {
        const years = Math.floor(months / 12);
        lines.push(`- Age: ${years} year${years !== 1 ? 's' : ''} old`);
      }
    }

    if (m.height || m.weight) lines.push(`- Height/Weight: ${[m.height, m.weight].filter(Boolean).join(', ')}`);
    if (m.activity_level) lines.push(`- Activity: ${m.activity_level}`);
    if (m.goals) lines.push(`- Goals: ${m.goals}`);
    if (m.supplements) lines.push(`- Supplements: ${m.supplements}`);
    if (m.notes) lines.push(`- Notes: ${m.notes}`);

    lines.push('');
  }

  lines.push('COOKING PHILOSOPHY:');
  lines.push('- Simple, low-effort meals');
  lines.push('- Batch cooking friendly');
  lines.push('- Same ingredients for whole family, just prepared differently for baby');

  return lines.join('\n');
};

export async function POST(request) {
  try {
    const { type, mealPlan, weeklyContext, mealType, day, currentMeal } = await request.json();

    // Fetch family members dynamically — used across all prompt types
    const { data: members } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at');
    const FAMILY_PROFILES = buildFamilyProfiles(members);

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
      // Fetch saved recipes with their ingredients so the grocery list is exact
      const { data: allRecipes } = await supabase
        .from('recipes')
        .select('name, ingredients');

      // Only include recipes that are actually referenced in this week's meal plan
      const usedRecipes = (allRecipes || []).filter(r =>
        r.ingredients && mealPlan.toLowerCase().includes(r.name.toLowerCase())
      );

      const recipeIngredients = usedRecipes.length > 0
        ? `\n\nINGREDIENTS FROM SAVED RECIPES USED THIS WEEK:\n${usedRecipes.map(r =>
            `${r.name}:\n${r.ingredients}`
          ).join('\n\n')}`
        : '';

      prompt = `Based on this weekly meal plan:\n\n${mealPlan}${recipeIngredients}\n\nCreate a grocery list organized by store section. Where saved recipe ingredients are provided above, use those exact ingredients. Return ONLY a valid JSON array, no other text. Format:
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
