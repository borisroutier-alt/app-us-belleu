import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Match {
  id: string;
  category: string;
  opponent: string;
  location: string;
  time: string;
  date: string;
  is_home: boolean;
}

interface MatchCardProps {
  item: Match;
  userChoice: 'present' | 'absent' | undefined;
  onSelectStatus: (matchId: string, status: 'present' | 'absent') => void;
}

export default function MatchCard({ item, userChoice, onSelectStatus }: MatchCardProps) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchCategory}>{item.category}</Text>
        <View style={[styles.locationBadge, { backgroundColor: item.is_home ? '#C5A059' : '#334155' }]}>
          <Text style={[styles.locationBadgeText, { color: item.is_home ? '#0F2241' : '#FFFFFF' }]}>
            {item.is_home ? 'DOMICILE' : 'EXTÉRIEUR'}
          </Text>
        </View>
      </View>

      <View style={styles.matchTeamsRow}>
        <Text style={styles.teamName}>U.S. BELLEU</Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={styles.teamName}>{item.opponent}</Text>
      </View>

      <View style={styles.matchFooter}>
        <Text style={styles.matchInfoText}>📅 {item.date}</Text>
        <Text style={styles.matchInfoText}>🕒 RDV : {item.time}</Text>
      </View>
      <Text style={styles.matchLocationText}>📍 {item.location}</Text>

      <View style={styles.statusActionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.presentButton, userChoice === 'present' && styles.presentActive]}
          onPress={() => onSelectStatus(item.id, 'present')}
        >
          <Text style={[styles.actionButtonText, userChoice === 'present' && styles.textActive]}>
            {userChoice === 'present' ? '🙋‍♂️ JE SERAI PRÉSENT' : '👍 Présent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.absentButton, userChoice === 'absent' && styles.absentActive]}
          onPress={() => onSelectStatus(item.id, 'absent')}
        >
          <Text style={[styles.actionButtonText, userChoice === 'absent' && styles.textActive]}>
            {userChoice === 'absent' ? '❌ INDISPONIBLE' : '👎 Absent'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  matchCard: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  matchCategory: { color: '#C5A059', fontWeight: 'bold', fontSize: 14 },
  locationBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  locationBadgeText: { fontSize: 10, fontWeight: 'bold' },
  matchTeamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  teamName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  vsText: { color: '#C5A059', fontWeight: 'bold', fontSize: 14, paddingHorizontal: 10 },
  matchFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  matchInfoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  matchLocationText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  statusActionRow: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingTop: 12, gap: 10 },
  actionButton: { flex: 1, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, backgroundColor: 'transparent' },
  actionButtonText: { fontSize: 13, fontWeight: 'bold' },
  presentButton: { borderColor: '#10B981' },
  absentButton: { borderColor: '#EF4444' },
  presentActive: { backgroundColor: '#10B981' },
  absentActive: { backgroundColor: '#EF4444' },
  textActive: { color: '#FFFFFF' },
});