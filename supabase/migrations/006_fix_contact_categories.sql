-- Fix existing contacts: move old granular category values to subcategory,
-- set top-level category = 'Food & Drink' for all existing food contacts

UPDATE uploaded_contacts
SET
  subcategory = CASE
    WHEN category IN (
      'Snacks & Crisps', 'Confectionery', 'Drinks', 'Coffee & Tea',
      'Beer & Brewing', 'Wine & Spirits', 'Bakery & Bread',
      'Dairy & Alternatives', 'Casual Dining & Restaurants',
      'Grocery & Food Brands', 'Health & Wellness Food',
      'Baby & Kids Food', 'Other'
    ) THEN category
    ELSE subcategory
  END,
  category = 'Food & Drink'
WHERE category IS NULL
   OR category IN (
      'Snacks & Crisps', 'Confectionery', 'Drinks', 'Coffee & Tea',
      'Beer & Brewing', 'Wine & Spirits', 'Bakery & Bread',
      'Dairy & Alternatives', 'Casual Dining & Restaurants',
      'Grocery & Food Brands', 'Health & Wellness Food',
      'Baby & Kids Food', 'Other'
   );
