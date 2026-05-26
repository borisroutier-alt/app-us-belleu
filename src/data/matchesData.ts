export interface Match {
  id: string;
  category: string;
  opponent: string;
  location: string;
  time: string;
  date: string;
  isHome: boolean;
}

export const MATCHES_DATA: Match[] = [
  {
    id: '1',
    category: 'SÉNIORS A',
    opponent: 'F.C. SOISSONS',
    location: 'Stade Municipal de Belleu',
    time: '15:00',
    date: 'Dimanche 24 Mai',
    isHome: true
  },
  {
    id: '2',
    category: 'SÉNIORS B',
    opponent: 'U.S. CHAUNY 3',
    location: 'Stade Léo Lagrange (Chauny)',
    time: '13:15',
    date: 'Dimanche 24 Mai',
    isHome: false
  },
  {
    id: '3',
    category: 'U15',
    opponent: 'A.S. VILLERS-COTTERÊTS',
    location: 'Stade Municipal de Belleu',
    time: '10:00',
    date: 'Samedi 23 Mai',
    isHome: true
  }
];