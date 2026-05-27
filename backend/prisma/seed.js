import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const menuItems = [
  // Veg Starters
  { name: 'Paneer Tikka', category: 'Veg Starters', price: 220, description: 'Smoky marinated cottage cheese, grilled to perfection', tags: ['spicy', 'veg', 'bestseller'], allergens: ['dairy'], popularScore: 0.9, imageUrl: '' },
  { name: 'Crispy Corn', category: 'Veg Starters', price: 160, description: 'Crunchy sweet corn tossed with spices', tags: ['light', 'veg', 'quick-serve'], allergens: [], popularScore: 0.75, imageUrl: '' },
  { name: 'Hara Bhara Kabab', category: 'Veg Starters', price: 180, description: 'Spinach and peas patties, lightly spiced', tags: ['light', 'veg'], allergens: ['gluten'], popularScore: 0.65, imageUrl: '' },
  { name: 'Mushroom 65', category: 'Veg Starters', price: 200, description: 'Deep fried mushrooms with South Indian spices', tags: ['spicy', 'veg'], allergens: [], popularScore: 0.7, imageUrl: '' },
  // Non-Veg Starters
  { name: 'Chilli Chicken Bites', category: 'Non-Veg Starters', price: 220, description: 'Crispy chicken tossed in fiery Indo-Chinese sauce', tags: ['spicy', 'bestseller'], allergens: ['gluten'], popularScore: 0.92, imageUrl: '' },
  { name: 'Prawn Pepper Fry', category: 'Non-Veg Starters', price: 280, description: 'South-style prawns with bold black pepper spice', tags: ['spicy'], allergens: ['shellfish'], popularScore: 0.8, imageUrl: '' },
  { name: 'Tandoori Fish Tikka', category: 'Non-Veg Starters', price: 260, description: 'Light marinade, smoky char-grilled fish', tags: ['light'], allergens: ['fish'], popularScore: 0.78, imageUrl: '' },
  { name: 'Chicken Seekh Kabab', category: 'Non-Veg Starters', price: 240, description: 'Minced chicken skewers with mint chutney', tags: ['bestseller'], allergens: [], popularScore: 0.85, imageUrl: '' },
  // Mains Veg
  { name: 'Paneer Butter Masala', category: 'Mains (Veg)', price: 280, description: 'Rich tomato-butter gravy with soft paneer', tags: ['filling', 'veg', 'bestseller'], allergens: ['dairy'], popularScore: 0.95, imageUrl: '' },
  { name: 'Dal Makhani', category: 'Mains (Veg)', price: 220, description: 'Slow-cooked black lentils in creamy tomato base', tags: ['filling', 'veg'], allergens: ['dairy'], popularScore: 0.88, imageUrl: '' },
  { name: 'Palak Paneer', category: 'Mains (Veg)', price: 260, description: 'Cottage cheese in spiced spinach gravy', tags: ['veg', 'light'], allergens: ['dairy'], popularScore: 0.82, imageUrl: '' },
  { name: 'Veg Kolhapuri', category: 'Mains (Veg)', price: 240, description: 'Fiery Maharashtrian mixed vegetable curry', tags: ['spicy', 'veg'], allergens: [], popularScore: 0.7, imageUrl: '' },
  // Mains Non-Veg
  { name: 'Butter Chicken', category: 'Mains (Non-Veg)', price: 320, description: 'Classic mildly spiced chicken in buttery tomato gravy', tags: ['filling', 'bestseller'], allergens: ['dairy'], popularScore: 0.97, imageUrl: '' },
  { name: 'Mutton Rogan Josh', category: 'Mains (Non-Veg)', price: 380, description: 'Kashmiri slow-cooked mutton with aromatic spices', tags: ['spicy', 'filling'], allergens: [], popularScore: 0.85, imageUrl: '' },
  { name: 'Prawn Masala', category: 'Mains (Non-Veg)', price: 360, description: 'Coastal-style prawns in tangy masala gravy', tags: ['spicy'], allergens: ['shellfish'], popularScore: 0.78, imageUrl: '' },
  { name: 'Chicken Biryani', category: 'Mains (Non-Veg)', price: 340, description: 'Fragrant basmati rice layered with spiced chicken', tags: ['filling', 'bestseller', 'chef_special'], allergens: [], popularScore: 0.96, imageUrl: '' },
  // Breads & Rice
  { name: 'Butter Naan', category: 'Breads & Rice', price: 50, description: 'Soft leavened bread brushed with butter', tags: ['veg'], allergens: ['gluten', 'dairy'], popularScore: 0.9, imageUrl: '' },
  { name: 'Garlic Naan', category: 'Breads & Rice', price: 60, description: 'Naan topped with garlic and herbs', tags: ['veg', 'bestseller'], allergens: ['gluten', 'dairy'], popularScore: 0.88, imageUrl: '' },
  { name: 'Laccha Paratha', category: 'Breads & Rice', price: 55, description: 'Flaky layered whole wheat bread', tags: ['veg'], allergens: ['gluten'], popularScore: 0.75, imageUrl: '' },
  { name: 'Steamed Rice', category: 'Breads & Rice', price: 80, description: 'Plain basmati rice, light and fluffy', tags: ['veg', 'light'], allergens: [], popularScore: 0.7, imageUrl: '' },
  // Desserts
  { name: 'Gulab Jamun', category: 'Desserts', price: 100, description: 'Soft milk dumplings soaked in rose-scented syrup', tags: ['sweet', 'veg', 'bestseller'], allergens: ['dairy', 'gluten'], popularScore: 0.9, imageUrl: '' },
  { name: 'Ras Malai', category: 'Desserts', price: 120, description: 'Soft paneer discs in chilled saffron milk', tags: ['sweet', 'veg'], allergens: ['dairy', 'nuts'], popularScore: 0.85, imageUrl: '' },
  { name: 'Chocolate Brownie', category: 'Desserts', price: 140, description: 'Warm fudgy brownie with vanilla ice cream', tags: ['sweet', 'chef_special'], allergens: ['dairy', 'gluten', 'eggs'], popularScore: 0.88, imageUrl: '' },
  { name: 'Kulfi Falooda', category: 'Desserts', price: 130, description: 'Traditional Indian ice cream with rose falooda', tags: ['sweet', 'veg'], allergens: ['dairy', 'nuts'], popularScore: 0.82, imageUrl: '' },
  // Hot Beverages
  { name: 'Masala Chai', category: 'Beverages (Hot)', price: 60, description: 'Spiced Indian tea brewed with ginger and cardamom', tags: ['veg', 'light', 'quick-serve'], allergens: ['dairy'], popularScore: 0.85, imageUrl: '' },
  { name: 'Filter Coffee', category: 'Beverages (Hot)', price: 70, description: 'South Indian strong decoction with frothy milk', tags: ['veg', 'quick-serve'], allergens: ['dairy'], popularScore: 0.8, imageUrl: '' },
  { name: 'Hot Chocolate', category: 'Beverages (Hot)', price: 120, description: 'Rich Belgian chocolate drink topped with cream', tags: ['sweet'], allergens: ['dairy'], popularScore: 0.75, imageUrl: '' },
  // Cold Beverages
  { name: 'Mango Lassi', category: 'Beverages (Cold)', price: 100, description: 'Thick chilled yogurt blended with Alphonso mango', tags: ['sweet', 'veg', 'bestseller'], allergens: ['dairy'], popularScore: 0.92, imageUrl: '' },
  { name: 'Fresh Lime Soda', category: 'Beverages (Cold)', price: 70, description: 'Zesty lime with sparkling water, sweet or salted', tags: ['light', 'veg', 'quick-serve'], allergens: [], popularScore: 0.85, imageUrl: '' },
  { name: 'Cold Coffee', category: 'Beverages (Cold)', price: 110, description: 'Blended iced coffee with milk and sugar', tags: ['veg'], allergens: ['dairy'], popularScore: 0.8, imageUrl: '' },
  { name: 'Watermelon Juice', category: 'Beverages (Cold)', price: 90, description: 'Fresh-pressed watermelon, chilled and refreshing', tags: ['light', 'veg'], allergens: [], popularScore: 0.75, imageUrl: '' },
  // Combos
  { name: 'Veg Thali', category: 'Combos & Deals', price: 350, description: '2 sabzis + dal + rice + 2 rotis + dessert', tags: ['veg', 'filling', 'bestseller', 'shareable'], allergens: ['dairy', 'gluten'], popularScore: 0.9, imageUrl: '' },
  { name: 'Non-Veg Thali', category: 'Combos & Deals', price: 450, description: 'Chicken curry + dal + rice + 2 naans + raita', tags: ['filling', 'bestseller', 'shareable'], allergens: ['dairy', 'gluten'], popularScore: 0.92, imageUrl: '' },
  { name: 'Starter Platter (Veg)', category: 'Combos & Deals', price: 480, description: 'Paneer Tikka + Crispy Corn + Hara Bhara Kabab', tags: ['veg', 'shareable'], allergens: ['dairy', 'gluten'], popularScore: 0.85, imageUrl: '' },
  { name: 'Starter Platter (Non-Veg)', category: 'Combos & Deals', price: 560, description: 'Chilli Chicken + Seekh Kabab + Fish Tikka', tags: ['shareable', 'bestseller'], allergens: ['gluten', 'fish'], popularScore: 0.88, imageUrl: '' },
];

async function main() {
  console.log('🌱 Seeding menu...');
  await prisma.menuItem.deleteMany();
  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log(`✅ Seeded ${menuItems.length} menu items`);
}

main().catch(console.error).finally(() => prisma.$disconnect());