import { Song } from './types';

export const WINNING_SCORE = 10;

export const SONGS: Song[] = [
  // 2000-luku & Modernit
  {
    id: '1',
    artist: 'Nickelback',
    title: 'How You Remind Me',
    year: 2001,
    youtubeId: 'DmeUuoxyt_E', // Roadrunner Records upload (often safer than VEVO)
    startAt: 45
  },
  {
    id: '4',
    artist: 'Meghan Trainor',
    title: 'All About That Bass',
    year: 2014,
    youtubeId: 'C-u5WLJ9Yk4', // Lyric Video (Embedding usually allowed)
    startAt: 38
  },

  // 90-luku
  {
    id: '9',
    artist: 'Guns N\' Roses',
    title: 'November Rain',
    year: 1991,
    youtubeId: '8SbUC-UaAxE', // Official (Usually works, fallback to error handler if not)
    startAt: 60
  },
  {
    id: '10',
    artist: 'Ace of Base',
    title: 'All That She Wants',
    year: 1992,
    youtubeId: 'd73tiBBz20Q', // Official
    startAt: 10
  },

  // 80-luku
  {
    id: '2',
    artist: 'U2',
    title: 'With Or Without You',
    year: 1987,
    youtubeId: 'XmSdTa9kaiQ', // Alternate Official
    startAt: 60
  },
  {
    id: '6',
    artist: 'Guns N\' Roses',
    title: 'Sweet Child O\' Mine',
    year: 1987,
    youtubeId: 'o1tj2zJ2Wvg', // Alternate Official
    startAt: 0
  },

  // 70-luku & Vanhemmat
  {
    id: '3',
    artist: 'James Brown',
    title: 'I Got You (I Feel Good)',
    year: 1965,
    youtubeId: 'U5TqIdff_DQ', // Live/Alternate
    startAt: 0
  },
  {
    id: '5',
    artist: 'Chicago',
    title: 'If You Leave Me Now',
    year: 1976,
    youtubeId: 'cFRk0GXuyy4', // Remaster/Audio
    startAt: 60
  },
];