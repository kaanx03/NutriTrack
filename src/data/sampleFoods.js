// src/data/sampleFoods.js
const sampleFoods = [
  // BREAKFAST FOODS (10 items)
  {
    id: "b1",
    name: "Scrambled Eggs",
    calories: 140,
    carbs: 2,
    protein: 12,
    fat: 9,
    weight: 100,
    mealType: "Breakfast",
  },
  {
    id: "b2",
    name: "Oatmeal with Fruits",
    calories: 220,
    carbs: 40,
    protein: 6,
    fat: 4,
    weight: 200,
    mealType: "Breakfast",
  },
  {
    id: "b3",
    name: "Greek Yogurt with Honey",
    calories: 180,
    carbs: 24,
    protein: 12,
    fat: 4,
    weight: 150,
    mealType: "Breakfast",
  },
  {
    id: "b4",
    name: "Avocado Toast",
    calories: 260,
    carbs: 30,
    protein: 6,
    fat: 14,
    weight: 120,
    mealType: "Breakfast",
  },
  {
    id: "b5",
    name: "Pancakes with Maple Syrup",
    calories: 340,
    carbs: 58,
    protein: 7,
    fat: 10,
    weight: 180,
    mealType: "Breakfast",
  },
  {
    id: "b6",
    name: "Turkish Simit",
    calories: 250,
    carbs: 45,
    protein: 8,
    fat: 5,
    weight: 100,
    mealType: "Breakfast",
  },
  {
    id: "b7",
    name: "Menemen (Turkish Egg Dish)",
    calories: 230,
    carbs: 8,
    protein: 14,
    fat: 17,
    weight: 200,
    mealType: "Breakfast",
  },
  {
    id: "b8",
    name: "Cheese & Olives Plate",
    calories: 290,
    carbs: 5,
    protein: 18,
    fat: 22,
    weight: 150,
    mealType: "Breakfast",
  },
  {
    id: "b9",
    name: "Fruit Smoothie Bowl",
    calories: 210,
    carbs: 42,
    protein: 5,
    fat: 3,
    weight: 250,
    mealType: "Breakfast",
  },
  {
    id: "b10",
    name: "Breakfast Wrap",
    calories: 380,
    carbs: 36,
    protein: 18,
    fat: 16,
    weight: 200,
    mealType: "Breakfast",
  },

  // LUNCH FOODS (10 items)
  {
    id: "l1",
    name: "Grilled Chicken Salad",
    calories: 350,
    carbs: 20,
    protein: 30,
    fat: 15,
    weight: 300,
    mealType: "Lunch",
  },
  {
    id: "l2",
    name: "Tuna Sandwich",
    calories: 420,
    carbs: 40,
    protein: 25,
    fat: 18,
    weight: 220,
    mealType: "Lunch",
  },
  {
    id: "l3",
    name: "Lentil Soup",
    calories: 230,
    carbs: 40,
    protein: 12,
    fat: 2,
    weight: 300,
    mealType: "Lunch",
  },
  {
    id: "l4",
    name: "Vegetable Stir Fry",
    calories: 280,
    carbs: 35,
    protein: 12,
    fat: 10,
    weight: 250,
    mealType: "Lunch",
  },
  {
    id: "l5",
    name: "Turkey Wrap",
    calories: 380,
    carbs: 45,
    protein: 22,
    fat: 12,
    weight: 220,
    mealType: "Lunch",
  },
  {
    id: "l6",
    name: "Adana Kebab Plate",
    calories: 480,
    carbs: 20,
    protein: 35,
    fat: 28,
    weight: 300,
    mealType: "Lunch",
  },
  {
    id: "l7",
    name: "Falafel Wrap",
    calories: 450,
    carbs: 60,
    protein: 15,
    fat: 15,
    weight: 280,
    mealType: "Lunch",
  },
  {
    id: "l8",
    name: "Beef Burger",
    calories: 550,
    carbs: 45,
    protein: 30,
    fat: 28,
    weight: 250,
    mealType: "Lunch",
  },
  {
    id: "l9",
    name: "Quinoa Bowl",
    calories: 420,
    carbs: 62,
    protein: 14,
    fat: 12,
    weight: 350,
    mealType: "Lunch",
  },
  {
    id: "l10",
    name: "Chicken Curry with Rice",
    calories: 520,
    carbs: 65,
    protein: 28,
    fat: 15,
    weight: 400,
    mealType: "Lunch",
  },

  // DINNER FOODS (10 items)
  {
    id: "d1",
    name: "Grilled Salmon",
    calories: 320,
    carbs: 0,
    protein: 40,
    fat: 18,
    weight: 180,
    mealType: "Dinner",
  },
  {
    id: "d2",
    name: "Spaghetti Bolognese",
    calories: 480,
    carbs: 65,
    protein: 25,
    fat: 14,
    weight: 350,
    mealType: "Dinner",
  },
  {
    id: "d3",
    name: "Vegetable Lasagna",
    calories: 420,
    carbs: 50,
    protein: 18,
    fat: 16,
    weight: 300,
    mealType: "Dinner",
  },
  {
    id: "d4",
    name: "Baked Chicken with Vegetables",
    calories: 380,
    carbs: 25,
    protein: 35,
    fat: 16,
    weight: 350,
    mealType: "Dinner",
  },
  {
    id: "d5",
    name: "Beef Stir Fry",
    calories: 440,
    carbs: 30,
    protein: 35,
    fat: 20,
    weight: 300,
    mealType: "Dinner",
  },
  {
    id: "d6",
    name: "Stuffed Bell Peppers",
    calories: 320,
    carbs: 30,
    protein: 20,
    fat: 12,
    weight: 250,
    mealType: "Dinner",
  },
  {
    id: "d7",
    name: "Lamb Kebab with Rice",
    calories: 580,
    carbs: 45,
    protein: 40,
    fat: 25,
    weight: 400,
    mealType: "Dinner",
  },
  {
    id: "d8",
    name: "Vegetable Curry",
    calories: 340,
    carbs: 45,
    protein: 12,
    fat: 14,
    weight: 300,
    mealType: "Dinner",
  },
  {
    id: "d9",
    name: "Stuffed Grape Leaves (Dolma)",
    calories: 380,
    carbs: 52,
    protein: 12,
    fat: 16,
    weight: 250,
    mealType: "Dinner",
  },
  {
    id: "d10",
    name: "Seafood Paella",
    calories: 490,
    carbs: 60,
    protein: 28,
    fat: 15,
    weight: 400,
    mealType: "Dinner",
  },

  // SNACK FOODS (10 items)
  {
    id: "s1",
    name: "Mixed Nuts",
    calories: 180,
    carbs: 6,
    protein: 6,
    fat: 16,
    weight: 30,
    mealType: "Snack",
  },
  {
    id: "s2",
    name: "Apple",
    calories: 95,
    carbs: 25,
    protein: 0.5,
    fat: 0.3,
    weight: 180,
    mealType: "Snack",
  },
  {
    id: "s3",
    name: "Protein Bar",
    calories: 220,
    carbs: 24,
    protein: 20,
    fat: 8,
    weight: 60,
    mealType: "Snack",
  },
  {
    id: "s4",
    name: "Hummus with Carrot Sticks",
    calories: 160,
    carbs: 20,
    protein: 5,
    fat: 8,
    weight: 120,
    mealType: "Snack",
  },
  {
    id: "s5",
    name: "Greek Yogurt",
    calories: 120,
    carbs: 8,
    protein: 14,
    fat: 4,
    weight: 150,
    mealType: "Snack",
  },
  {
    id: "s6",
    name: "Turkish Delight",
    calories: 140,
    carbs: 35,
    protein: 0,
    fat: 0,
    weight: 40,
    mealType: "Snack",
  },
  {
    id: "s7",
    name: "Fruit Smoothie",
    calories: 180,
    carbs: 40,
    protein: 3,
    fat: 1,
    weight: 250,
    mealType: "Snack",
  },
  {
    id: "s8",
    name: "Cheese Slices",
    calories: 120,
    carbs: 1,
    protein: 8,
    fat: 10,
    weight: 30,
    mealType: "Snack",
  },
  {
    id: "s9",
    name: "Dark Chocolate",
    calories: 150,
    carbs: 15,
    protein: 2,
    fat: 10,
    weight: 25,
    mealType: "Snack",
  },
  {
    id: "s10",
    name: "Rice Cakes with Honey",
    calories: 110,
    carbs: 24,
    protein: 2,
    fat: 1,
    weight: 35,
    mealType: "Snack",
  },
];

export default sampleFoods;
