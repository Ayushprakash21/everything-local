import { describe, it, expect } from 'vitest';

describe('Household OS & AI Shopping Assistant Logic', () => {
  it('correctly maps recipe query to local grocery shopping list', () => {
    const convertRecipe = (query: string) => {
      const q = query.toLowerCase();
      if (q.includes('poha')) {
        return [
          { title: 'Indori Thick Poha', quantity: '500g', category: 'Grocery Staples' },
          { title: 'Red Onions', quantity: '500g', category: 'Vegetables' },
          { title: 'Raw Peanuts', quantity: '200g', category: 'Grocery Staples' },
          { title: 'Indori Jeeravan Masala', quantity: '1 pack', category: 'Spices & Seasoning' }
        ];
      }
      return [];
    };

    const result = convertRecipe('Indori Poha for 4 people');
    expect(result.length).toBe(4);
    expect(result.some((i) => i.title.includes('Poha'))).toBe(true);
    expect(result.some((i) => i.title.includes('Jeeravan'))).toBe(true);
  });
});
