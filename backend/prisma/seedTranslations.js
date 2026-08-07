import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const translations = {
  'Paneer Tikka': { hi: { name: 'पनीर टिक्का', description: 'धुएं में पकाया हुआ मसालेदार पनीर' } },
  'Butter Chicken': { hi: { name: 'बटर चिकन', description: 'मक्खन और टमाटर की ग्रेवी में चिकन' } },
  'Dal Makhani': { hi: { name: 'दाल मखनी', description: 'मक्खन में पकी काली दाल' } },
  'Paneer Butter Masala': { hi: { name: 'पनीर बटर मसाला', description: 'मक्खन मसाला ग्रेवी में पनीर' } },
  'Chicken Biryani': { hi: { name: 'चिकन बिरयानी', description: 'सुगंधित चावल के साथ मसालेदार चिकन' } },
  'Gulab Jamun': { hi: { name: 'गुलाब जामुन', description: 'गुलाब शर्बत में भिगोई हुई मिठाई' } },
  'Masala Chai': { hi: { name: 'मसाला चाय', description: 'अदरक और इलायची के साथ मसालेदार चाय' } },
  'Mango Lassi': { hi: { name: 'मैंगो लस्सी', description: 'आम और दही का ठंडा पेय' } },
  'Butter Naan': { hi: { name: 'बटर नान', description: 'मक्खन लगी नरम नान' } },
  'Garlic Naan': { hi: { name: 'लहसुन नान', description: 'लहसुन और जड़ी बूटियों वाली नान' } },
  'Veg Thali': { hi: { name: 'वेज थाली', description: '2 सब्जियां + दाल + चावल + 2 रोटी + मिठाई' } },
  'Non-Veg Thali': { hi: { name: 'नॉन वेज थाली', description: 'चिकन करी + दाल + चावल + 2 नान + रायता' } },
}

async function main() {
  console.log('🌐 Seeding translations...')
  const items = await prisma.menuItem.findMany()

  for (const item of items) {
    const trans = translations[item.name]
    if (trans?.hi) {
      await prisma.menuTranslation.upsert({
        where: { menuItemId_language: { menuItemId: item.id, language: 'hi' } },
        update: trans.hi,
        create: { menuItemId: item.id, language: 'hi', ...trans.hi }
      })
    }
  }
  console.log('✅ Translations seeded')
}

main().catch(console.error).finally(() => prisma.$disconnect())