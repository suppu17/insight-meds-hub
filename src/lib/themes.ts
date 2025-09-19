export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  cssVariables: Record<string, string>;
}

export const themes: ThemePalette[] = [
  {
    id: 'orange-black',
    name: 'Orange Glow',
    description: 'Current orange and black theme',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      background: '#0a0a0a',
      accent: '#ff8c42'
    },
    cssVariables: {
      '--background': '0 0% 5%',
      '--foreground': '0 0% 95%',
      '--primary': '25 100% 50%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '0 0% 12%',
      '--secondary-foreground': '0 0% 85%',
      '--accent': '30 95% 55%',
      '--accent-foreground': '0 0% 100%',
      '--muted': '0 0% 15%',
      '--muted-foreground': '0 0% 65%',
      '--card': '0 0% 8%',
      '--card-foreground': '0 0% 85%',
      '--border': '25 50% 25%',
      '--input': '0 0% 12%',
      '--ring': '25 100% 50%'
    }
  },
  {
    id: 'sage-green',
    name: 'Sage Garden',
    description: 'Calming sage green with cream accents',
    colors: {
      primary: '#87a96b',
      secondary: '#b8c9a4',
      background: '#2d3a2e',
      accent: '#c4d4b0'
    },
    cssVariables: {
      '--background': '125 20% 20%',
      '--foreground': '120 15% 90%',
      '--primary': '100 25% 55%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '110 20% 25%',
      '--secondary-foreground': '120 15% 85%',
      '--accent': '105 30% 70%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '120 15% 30%',
      '--muted-foreground': '120 10% 70%',
      '--card': '125 18% 22%',
      '--card-foreground': '120 15% 85%',
      '--border': '100 25% 40%',
      '--input': '120 20% 18%',
      '--ring': '100 25% 55%'
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Depths',
    description: 'Deep ocean blues with light blue accents',
    colors: {
      primary: '#2c5aa0',
      secondary: '#5a8bc4',
      background: '#1a2332',
      accent: '#87ceeb'
    },
    cssVariables: {
      '--background': '215 30% 15%',
      '--foreground': '210 20% 90%',
      '--primary': '215 60% 45%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '210 25% 20%',
      '--secondary-foreground': '210 20% 85%',
      '--accent': '200 70% 70%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '210 20% 25%',
      '--muted-foreground': '210 15% 70%',
      '--card': '215 28% 17%',
      '--card-foreground': '210 20% 85%',
      '--border': '215 40% 35%',
      '--input': '210 25% 15%',
      '--ring': '215 60% 45%'
    }
  },
  {
    id: 'warm-brown',
    name: 'Earth Tones',
    description: 'Warm browns with golden accents',
    colors: {
      primary: '#8b4513',
      secondary: '#cd853f',
      background: '#2f1b14',
      accent: '#daa520'
    },
    cssVariables: {
      '--background': '25 45% 15%',
      '--foreground': '30 20% 90%',
      '--primary': '25 65% 35%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '25 35% 20%',
      '--secondary-foreground': '30 20% 85%',
      '--accent': '43 75% 50%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '25 30% 25%',
      '--muted-foreground': '30 15% 70%',
      '--card': '25 40% 17%',
      '--card-foreground': '30 20% 85%',
      '--border': '25 50% 30%',
      '--input': '25 35% 15%',
      '--ring': '25 65% 35%'
    }
  },
  {
    id: 'coral-pink',
    name: 'Coral Sunset',
    description: 'Soft coral pink with cream accents',
    colors: {
      primary: '#ff6b6b',
      secondary: '#ff9999',
      background: '#2a1a1a',
      accent: '#ffb3ba'
    },
    cssVariables: {
      '--background': '0 20% 15%',
      '--foreground': '350 15% 90%',
      '--primary': '0 100% 70%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '0 15% 20%',
      '--secondary-foreground': '350 15% 85%',
      '--accent': '350 100% 85%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '0 10% 25%',
      '--muted-foreground': '350 10% 70%',
      '--card': '0 18% 17%',
      '--card-foreground': '350 15% 85%',
      '--border': '0 60% 40%',
      '--input': '0 15% 15%',
      '--ring': '0 100% 70%'
    }
  },
  {
    id: 'lavender-purple',
    name: 'Lavender Dreams',
    description: 'Soft purple with light lavender accents',
    colors: {
      primary: '#9370db',
      secondary: '#b19cd9',
      background: '#2a1f3d',
      accent: '#dda0dd'
    },
    cssVariables: {
      '--background': '260 35% 18%',
      '--foreground': '270 20% 90%',
      '--primary': '260 60% 65%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '260 25% 22%',
      '--secondary-foreground': '270 20% 85%',
      '--accent': '300 60% 70%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '260 20% 28%',
      '--muted-foreground': '270 15% 70%',
      '--card': '260 30% 20%',
      '--card-foreground': '270 20% 85%',
      '--border': '260 40% 45%',
      '--input': '260 25% 17%',
      '--ring': '260 60% 65%'
    }
  },
  {
    id: 'charcoal-gray',
    name: 'Monochrome',
    description: 'Elegant grays with white accents',
    colors: {
      primary: '#696969',
      secondary: '#a9a9a9',
      background: '#1a1a1a',
      accent: '#d3d3d3'
    },
    cssVariables: {
      '--background': '0 0% 10%',
      '--foreground': '0 0% 95%',
      '--primary': '0 0% 45%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '0 0% 15%',
      '--secondary-foreground': '0 0% 85%',
      '--accent': '0 0% 80%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '0 0% 20%',
      '--muted-foreground': '0 0% 70%',
      '--card': '0 0% 12%',
      '--card-foreground': '0 0% 85%',
      '--border': '0 0% 30%',
      '--input': '0 0% 8%',
      '--ring': '0 0% 45%'
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Deep',
    description: 'Deep forest green with lime accents',
    colors: {
      primary: '#228b22',
      secondary: '#32cd32',
      background: '#1a2f1a',
      accent: '#90ee90'
    },
    cssVariables: {
      '--background': '120 30% 15%',
      '--foreground': '120 20% 90%',
      '--primary': '120 60% 35%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '120 25% 20%',
      '--secondary-foreground': '120 20% 85%',
      '--accent': '120 70% 75%',
      '--accent-foreground': '0 0% 10%',
      '--muted': '120 20% 25%',
      '--muted-foreground': '120 15% 70%',
      '--card': '120 28% 17%',
      '--card-foreground': '120 20% 85%',
      '--border': '120 40% 30%',
      '--input': '120 25% 12%',
      '--ring': '120 60% 35%'
    }
  }
];

export const getThemeById = (id: string): ThemePalette | undefined => {
  return themes.find(theme => theme.id === id);
};

export const applyTheme = (theme: ThemePalette) => {
  const root = document.documentElement;

  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Add theme class to body for additional styling if needed
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${theme.id}`);
};