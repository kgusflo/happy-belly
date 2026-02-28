import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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
- Portions: ~2 tablespoons per serving
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
      prompt = `${FAMILY_PROFILES}
Create a 7-day meal plan for this family. For each day include breakfast, lunch, dinner, and 1-2 snacks.

Format each day like this:
**Monday**
- Breakfast: [meal]
- Lunch: [meal]
- Dinner: [meal]
- Snacks: [snack ideas]
- Baby's portions: [how to prepare for baby]

Keep meals simple and practical. Prioritize iron-rich foods, protein, and foods that work for the whole family.

${weeklyContext ? `This week's context from the user: ${weeklyContext}` : ''}`;

    } else if (type === 'grocery-list') {
      prompt = `Based on this weekly meal plan:\n\n${mealPlan}\n\nCreate a grocery list organized by store section.

Format it like:
**Produce**
- item

**Protein**
- item

**Dairy**
- item

**Pantry & Dry Goods**
- item

**Frozen**
- item

Include approximate quantities. This is for 2 adults and a 6-month-old baby.`;
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
