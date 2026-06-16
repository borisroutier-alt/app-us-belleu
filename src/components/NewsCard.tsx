import { useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Article {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  color?: string;
  emoji?: string;
  image_url?: string | null; // 📸 1. Prise en compte de l'image de Supabase
}

interface NewsCardProps {
  item: Article;
}

// Dictionnaire d'images d'illustration automatiques (si pas d'image personnalisée)
const getIllustration = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('SÉNIOR') || cat.includes('MATCH') || cat.includes('JOUEUR')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&q=80';
  }
  if (cat.includes('JEUNES') || cat.includes('ÉCOLE') || cat.includes('STAGE')) {
    return 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500&q=80';
  }
  if (cat.includes('CONVIVIALITÉ') || cat.includes('FESTI') || cat.includes('REPAS')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';
  }
  return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&q=80';
};

const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const router = useRouter();

  // 📸 2. PRIORITÉ À L'IMAGE SUPABASE : Si elle n'existe pas, on prend l'Unsplash automatique
  const imageUrl = item.image_url ? item.image_url : getIllustration(item.category);

  return (
    // 🚪 3. AJOUT DU TOUCHABLEOPACITY : Permet de cliquer sur la carte pour aller sur [id].tsx
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={() => router.push(`/news/${item.id}`)}
      activeOpacity={0.9}
    >
      {/* ÉLÉMENT VISUEL : Image principale (Perso ou Auto) avec overlay dégradé */}
      <ImageBackground source={{ uri: imageUrl }} style={styles.imageBackground}>
        <View style={styles.gradientOverlay}>
          <View style={[styles.badge, { backgroundColor: item.color || '#C5A059' }]}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
      </ImageBackground>

      {/* TEXTE : Contenu de l'article en dessous */}
      <View style={styles.textContent}>
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        <Text style={styles.date}>📅 Publié le {item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F2241',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  imageBackground: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    padding: 15,
    backgroundColor: 'rgba(6, 19, 41, 0.55)', // Assombrit légèrement l'image pour le texte
    height: '100%',
    justifyContent: 'flex-end',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
  },
  textContent: {
    padding: 15,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default NewsCard;