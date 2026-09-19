import React from 'react';
import {
  Code,
  BookOpen,
  Dumbbell,
  Droplets,
  Brain,
  Flame,
  Activity,
  Zap,
  Coffee,
  Moon,
  Sun,
  Shield,
  Heart,
  Laptop,
  Utensils,
  Target,
  Sparkles,
  Music,
  DollarSign,
  PenTool,
  Feather,
  Bike,
  LucideIcon,
} from 'lucide-react';

const ICON_DICTIONARY: Record<string, LucideIcon> = {
  code: Code,
  book: BookOpen,
  study: BookOpen,
  workout: Dumbbell,
  exercise: Dumbbell,
  water: Droplets,
  mindfulness: Brain,
  meditate: Brain,
  flame: Flame,
  health: Activity,
  zap: Zap,
  energy: Zap,
  coffee: Coffee,
  sleep: Moon,
  morning: Sun,
  shield: Shield,
  heart: Heart,
  laptop: Laptop,
  food: Utensils,
  target: Target,
  music: Music,
  finance: DollarSign,
  write: PenTool,
  journal: Feather,
  bike: Bike,

  // Fallback for emoji characters
  '💻': Code,
  '📚': BookOpen,
  '🏋️': Dumbbell,
  '💧': Droplets,
  '🧠': Brain,
  '🧘': Brain,
  '🎨': PenTool,
  '🍎': Utensils,
  '💤': Moon,
  '💰': DollarSign,
  '🎸': Music,
  '📝': Feather,
  '🌿': Activity,
  '🚴': Bike,
  '⚡': Zap,
  '🔥': Flame,
  '✨': Sparkles,
};

export const AVAILABLE_ICONS = [
  { key: 'code', label: 'Coding', icon: Code },
  { key: 'book', label: 'Reading / Study', icon: BookOpen },
  { key: 'workout', label: 'Workout', icon: Dumbbell },
  { key: 'water', label: 'Hydration', icon: Droplets },
  { key: 'mindfulness', label: 'Mindfulness', icon: Brain },
  { key: 'health', label: 'Health', icon: Activity },
  { key: 'laptop', label: 'Work', icon: Laptop },
  { key: 'sleep', label: 'Sleep & Rest', icon: Moon },
  { key: 'morning', label: 'Morning Routine', icon: Sun },
  { key: 'food', label: 'Nutrition', icon: Utensils },
  { key: 'target', label: 'Focus Target', icon: Target },
  { key: 'write', label: 'Journaling', icon: Feather },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'bike', label: 'Outdoors', icon: Bike },
];

export function getHabitIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return Zap;
  const key = iconKey.toLowerCase().trim();
  return ICON_DICTIONARY[key] || ICON_DICTIONARY[iconKey] || Zap;
}

export const HabitIconView: React.FC<{ iconKey?: string; className?: string }> = ({
  iconKey,
  className = 'w-4 h-4 stroke-[1.5]',
}) => {
  const IconComponent = getHabitIcon(iconKey);
  return <IconComponent className={className} />;
};
