import { Injectable } from '@angular/core';

type Theme = 'climbing' | 'weed' | 'film' | 'music' | 'code' | 'italy' | 'silly' | 'lowball';

interface WordBank {
  adjectives: string[];
  nouns: string[];
  actions: string[];
  concepts: string[];
  places: string[];
}

/**
 * Generates fun random names for climbing routes.
 * Combines themed word banks (climbing, film, music, etc.) with various formats.
 */
@Injectable({ providedIn: 'root' })
export class RouteNameGeneratorService {
  private readonly themeWordBanks: Record<Theme, WordBank> = {
    climbing: {
      adjectives: ['Crimpy', 'Slabby', 'Dynamic', 'Vertical', 'Overhung', 'Technical', 'Burly', 'Delicate', 'Powerful', 'Reachy'],
      nouns: ['Slab', 'Jug', 'Overhang', 'Dyno', 'Crimp', 'Pinch', 'Pocket', 'Gaston', 'Undercling', 'Arete'],
      actions: ['Push', 'Pop', 'Crimp', 'Mantle', 'Dyno', 'Campus', 'Deadpoint', 'Flag', 'Smear', 'Heel Hook'],
      concepts: ['Send', 'Beta', 'Topout', 'Flash', 'Project', 'Crux', 'Sequence', 'Flow'],
      places: ['The Cave', 'The Prow', 'The Slab', 'The Roof', 'The Bulge', 'The Corner'],
    },
    weed: {
      adjectives: ['Dank', 'Sticky', 'Chronic', 'Lazy', 'Mellow', 'Hazy', 'Purple', 'Green', 'Frosty', 'Kush'],
      nouns: ['Spliff', 'Bud', 'Doobie', 'Joint', 'Blunt', 'Herb', 'Stash', 'Nugget', 'Kief', 'Roach'],
      actions: ['Puff', 'Roll', 'Blaze', 'Toke', 'Spark', 'Pass', 'Grind', 'Pack'],
      concepts: ['420', 'Highness', 'Greenout', 'Munchies', 'Chill', 'Vibes', 'Session'],
      places: ['Couch', 'Hotbox', 'Garden', 'Clouds', 'Amsterdam', 'Garage'],
    },
    film: {
      adjectives: ['Pulpy', 'Iconic', 'Cinematic', 'Noir', 'Epic', 'Vintage', 'Cult', 'Retro', 'Classic'],
      nouns: ['Royale', 'Fiction', 'Django', 'Bride', 'Harvey', 'Totoro', 'Castle', 'Howl', 'Lebowski', 'Trinity'],
      actions: ['Dance', 'Walk', 'Run', 'Shoot', 'Twist', 'Jump', 'Fly', 'Drive'],
      concepts: ['Cheese', 'Quarter Pounder', 'Briefcase', 'Sword', 'Rug', 'Soot Sprite', 'Bathhouse'],
      places: ['Tarantino Land', 'Ghibli Studio', 'The Matrix', 'The Dojo', 'The Apartment', 'Kansas'],
    },
    music: {
      adjectives: ['Electric', 'Funky', 'Groovy', 'Heavy', 'Smooth', 'Raw', 'Jazzy', 'Bluesy', 'Punky'],
      nouns: ['Riff', 'Beat', 'Bass', 'Drum', 'Groove', 'Solo', 'Chord', 'Hook', 'Drop', 'Bridge'],
      actions: ['Jam', 'Shred', 'Drop', 'Loop', 'Sample', 'Mix', 'Scratch', 'Strum'],
      concepts: ['Vinyl', 'Analog', 'Reverb', 'Echo', 'Distortion', 'Wah', 'Feedback'],
      places: ['The Stage', 'Studio', 'The Pit', 'Backstage', 'The Festival', 'Woodstock'],
    },
    code: {
      adjectives: ['Recursive', 'Asynchronous', 'Deprecated', 'Legacy', 'Optimized', 'Compiled', 'Buggy', 'Refactored'],
      nouns: ['Stack', 'Heap', 'Buffer', 'Cache', 'Thread', 'Loop', 'Function', 'Class', 'Variable', 'Array'],
      actions: ['Debug', 'Compile', 'Deploy', 'Merge', 'Commit', 'Push', 'Fork', 'Clone'],
      concepts: ['Overflow', 'Exception', 'Null Pointer', 'Memory Leak', 'Race Condition', 'Deadlock'],
      places: ['Production', 'Dev Environment', 'The Cloud', 'Git Hell', 'Stack Overflow', 'Terminal'],
    },
    italy: {
      adjectives: ['Bella', 'Grande', 'Piccola', 'Dolce', 'Antica', 'Fresca', 'Forte', 'Vera'],
      nouns: ['Pasta', 'Pizza', 'Espresso', 'Vespa', 'Gondola', 'Piazza', 'Torre', 'Villa'],
      actions: ['Mangia', 'Bevi', 'Canta', 'Balla', 'Sogna', 'Vola'],
      concepts: ['Amore', 'Famiglia', 'Festa', 'Dolce Vita', 'Bella Figura', 'Passione'],
      places: ['Roma', 'Venezia', 'Firenze', 'Napoli', 'Sicilia', 'Toscana'],
    },
    silly: {
      adjectives: ['Wobbly', 'Squiggly', 'Bouncy', 'Jiggly', 'Floppy', 'Wonky', 'Goofy', 'Wacky', 'Zany'],
      nouns: ['Banana', 'Noodle', 'Potato', 'Marshmallow', 'Jellybean', 'Pickle', 'Waffle', 'Donut'],
      actions: ['Wiggle', 'Bounce', 'Flop', 'Wobble', 'Squish', 'Boop', 'Yeet', 'Bonk'],
      concepts: ['Chaos', 'Shenanigans', 'Tomfoolery', 'Nonsense', 'Mischief', 'Hijinks'],
      places: ['Funville', 'Silly Town', 'Wacky Land', 'Chaos Zone', 'Derp City'],
    },
    lowball: {
      adjectives: ['Low', 'Short', 'Compact', 'Grounded', 'Squat', 'Ground-Level', 'Tiny', 'Mini'],
      nouns: ['Boulder', 'Problem', 'Traverse', 'Sit Start', 'Compression', 'Mantle'],
      actions: ['Crouch', 'Squat', 'Duck', 'Roll', 'Crawl', 'Scoot'],
      concepts: ['Ground Game', 'Ankle Breaker', 'Pad Stack', 'Safe Fall', 'No Height'],
      places: ['The Floor', 'Ground Zero', 'Bottom Out', 'Basement', 'Low Tide'],
    },
  };

  private readonly themes: Theme[] = ['climbing', 'weed', 'film', 'music', 'code', 'italy', 'silly', 'lowball'];

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  generateRouteName(): string {
    const theme = this.pickRandom(this.themes);
    const bank = this.themeWordBanks[theme];

    const formats = [
      () => `${this.pickRandom(bank.adjectives)} ${this.pickRandom(bank.nouns)}`,
      () => `${this.pickRandom(bank.actions)} the ${this.pickRandom(bank.nouns)}`,
      () => `${this.pickRandom(bank.nouns)} of ${this.pickRandom(bank.places)}`,
      () => `${this.pickRandom(bank.concepts)} on ${this.pickRandom(bank.places)}`,
      () => `${this.pickRandom(bank.adjectives)} ${this.pickRandom(bank.concepts)}`,
      () => `The ${this.pickRandom(bank.adjectives)} ${this.pickRandom(bank.nouns)}`,
      () => `${this.pickRandom(bank.actions)} ${this.pickRandom(bank.concepts)}`,
    ];

    return this.pickRandom(formats)();
  }
}
