import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// On redéfinit l'interface locale pour que TypeScript sache ce qu'est un article
export interface Article {
  id: string;
  category: string;
  title: string;
  date: string;
  description: string;
  emoji: string;
  color: string;
}

interface NewsCardProps {
  item: Article;
}

export default function NewsCard({ item }: NewsCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.newsCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/news/[id]", params: { id: item.id } })}
    >
      <View style={[styles.cardImagePlaceholder, { backgroundColor: item.color }]}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text> 
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  newsCard: { backgroundColor: '#0F2241', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  cardImagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 50 },
  cardContent: { padding: 15 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(197, 160, 89, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#C5A059', marginBottom: 8 },
  categoryText: { color: '#C5A059', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDate: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, marginBottom: 10 },
  cardDescription: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 20 },
});