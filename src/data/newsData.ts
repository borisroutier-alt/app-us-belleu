export interface Article {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  emoji: string;
  color: string;
}

export const NEWS_DATA: Article[] = [
  {
    id: '1',
    category: 'SÉNIORS A',
    title: 'Victoire cruciale à domicile ! ⚽',
    date: 'Dimanche 17 Mai',
    description: 'Magnifique performance des bleus et or qui s\'imposent 3-1 face à un concurrent direct. Les buteurs : Thomas (22\'), Lucas (54\') et un penalty de notre capitaine en fin de match (88\'). Merci aux supporters venus nombreux !',
    emoji: '⚽',
    color: '#1E3A8A'
  },
  {
    id: '2',
    category: 'ÉVÉNEMENT',
    title: 'Grand Tournoi de Printemps 🏆',
    date: 'Samedi 30 Mai',
    description: 'Le club organise son tournoi annuel pour les catégories U11 et U13 au stade municipal. Buvette, restauration sur place et tombola avec de nombreux lots à gagner. Venez encourager nos jeunes licenciés !',
    emoji: '🏆',
    color: '#78350F'
  }
];