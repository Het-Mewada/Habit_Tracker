const { PrismaClient } = require('../node_modules/@prisma/client');
const db = new PrismaClient();

async function fixHabits() {
  console.log('Migrating existing habits in dev.db to vector icon keys and muted colors...');
  
  const habits = await db.habit.findMany();
  
  const iconMap = {
    '💻': 'code',
    '📚': 'book',
    '🏋️': 'workout',
    '💧': 'water',
    '🧠': 'mindfulness',
    '⚡': 'zap',
  };

  for (const h of habits) {
    const newIcon = iconMap[h.icon] || h.icon || 'code';
    const newColor = '#4a5d4e'; // Muted Sage
    
    await db.habit.update({
      where: { id: h.id },
      data: {
        icon: newIcon,
        color: newColor,
      },
    });
    console.log(`Updated habit "${h.name}": icon -> "${newIcon}", color -> "${newColor}"`);
  }
  
  console.log('Database migration complete!');
}

fixHabits()
  .catch(console.error)
  .finally(() => db.$disconnect());
