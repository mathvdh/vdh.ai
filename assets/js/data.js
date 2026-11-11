// All site content lives here. The page sections and the terminal both read from it.
// Edit this file to update the site.

export const PERSON = {
  name: 'Mathieu Van der Haegen',
  handle: 'mathvdh',
  email: 'info@vdh.ai',
  linkedin: 'https://linkedin.com/in/mathvdh/',
  instagram: 'https://www.instagram.com/mathvdh/',
  source: 'https://github.com/mathvdh/vdh.ai',
  city: 'London',
  company: {
    name: 'VDH LTD',
    address: '10 John Street, London WC1N 2EB, United Kingdom',
  },
};

// Branch colours map to CSS custom properties (see style.css).
export const BRANCHES = {
  main: 'var(--br-main)',
  digicracy: 'var(--br-cyan)',
  b40lux: 'var(--br-amber)',
  dcy: 'var(--br-magenta)',
  'vdh-ltd': 'var(--br-lime)',
};

// Newest first, like `git log`. `lane` is the column in the graph.
export const COMMITS = [
  {
    id: 'head', hash: 'f00dcaf', lane: 0, branch: 'main', refs: ['HEAD -> main'],
    year: 'now', msg: 'wip: next venture: tech with real-world impact',
    parents: ['marathon'],
    show: {
      date: '2026 → ∞',
      body: 'Exploring the next venture: technology that measurably improves people\'s health, wellbeing and the planet\'s future.',
      diff: [
        ['+', 'looking for co-founders'],
        ['+', 'looking for mentors'],
        ['+', 'open to mission-aligned opportunities'],
        ['-', 'growth for growth\'s sake'],
      ],
      cta: { label: 'git push origin coffee → ping me', href: '#ping' },
    },
  },
  {
    id: 'marathon', hash: 'a42195e', lane: 0, branch: 'main', refs: [],
    year: '2025', msg: 'feat(life): first marathon, in barefoot shoes',
    parents: ['mdcy'],
    show: {
      date: 'June 2025 · Tissington Trail Marathon, UK',
      body: 'Six months of prep. Packed everything except running shoes. Ran it anyway.',
      diff: [
        ['+', '42.2 km · 700 m ascent'],
        ['+', 'finish: 4h22'],
        ['-', 'left foot (for a week)'],
        ['~', 'TODO: run another one, with actual shoes'],
      ],
      cta: { label: 'less notes/my-first-marathon.md', note: 'my-first-marathon' },
    },
  },
  {
    id: 'vdh', hash: 'c0ffee5', lane: 1, branch: 'vdh-ltd', refs: ['vdh-ltd'],
    year: '2023', msg: 'feat: start VDH LTD in London',
    parents: ['mdcy'],
    show: {
      role: 'Founder & CEO', where: 'London, UK', date: '2023 → now',
      body: 'My own company: a home for consulting work, a test bench for new business ideas, and a launchpad for new companies.',
      diff: [
        ['+', 'consulting for existing clients'],
        ['+', 'global health: vaccine management systems for the WHO'],
        ['+', 'experiments → future companies'],
      ],
    },
  },
  {
    id: 'mdcy', hash: 'e1c5a3d', lane: 0, branch: 'main', refs: [], merge: true,
    year: '2023', msg: 'Merge branch \'dcy\': exit, kept a minority stake',
    parents: ['mb40', 'dcy'],
    show: {
      date: '2023',
      body: 'Stepped out of the active role after a smooth handover. Kept a minority stake and moved to an advisory seat.',
      diff: [['-', 'day-to-day CTO duties'], ['+', 'advisor · minority shareholder']],
    },
  },
  {
    id: 'dcy', hash: 'dc1f00d', lane: 1, branch: 'dcy', refs: ['dcy'],
    year: '2020', msg: 'feat: co-found DCY: automated crypto asset management',
    parents: ['mb40'],
    show: {
      role: 'Co-founder & CTO', where: 'Belgium / Dubai', date: '2020 → 2023 (exited)',
      url: 'https://www.dcy.io',
      body: 'Built after b40Lux showed the limits of traditional crypto investment vehicles. Automated asset management for individual and institutional clients.',
      diff: [
        ['+', 'the whole technical infrastructure'],
        ['+', 'ML-based trading systems'],
        ['+', 'risk-management protocols'],
      ],
    },
  },
  {
    id: 'mb40', hash: 'b40c105', lane: 0, branch: 'main', refs: [], merge: true,
    year: '2020', msg: 'Merge branch \'b40lux\': fund closed, lessons → DCY',
    parents: ['mdig', 'b40'],
    show: {
      date: '2020',
      body: 'Traditional fund structures turned out too rigid for crypto. Closed the fund and rebuilt the idea as a more flexible platform.',
      diff: [['-', 'b40Lux fund'], ['+', 'a clear view of institutional crypto + regulation']],
    },
  },
  {
    id: 'mdig', hash: 'd161ac7', lane: 0, branch: 'main', refs: [], merge: true,
    year: '2018', msg: 'Merge branch \'digicracy\': exit after 6 years',
    parents: ['root', 'dig'],
    show: {
      date: '2018',
      body: 'Six years of growth serving democratic institutions across Europe, then an exit.',
      diff: [['+', 'exit'], ['+', 'scar tissue, the useful kind']],
    },
  },
  {
    id: 'b40', hash: 'b40a1fa', lane: 2, branch: 'b40lux', refs: ['b40lux'],
    year: '2017', msg: 'feat: co-found b40Lux: regulated crypto hedge fund',
    parents: ['root'],
    show: {
      role: 'Co-founder & CTO', where: 'Luxembourg', date: '2017 → 2020 (closed)',
      body: 'One of Luxembourg\'s first regulated crypto hedge funds.',
      diff: [
        ['+', 'algorithmic trading infrastructure'],
        ['+', 'compliance systems'],
        ['+', 'several million € under management'],
      ],
    },
  },
  {
    id: 'dig', hash: 'd16c4a5', lane: 1, branch: 'digicracy', refs: ['digicracy'],
    year: '2012', msg: 'feat: found Digicracy ("digital democracy")',
    parents: ['root'],
    show: {
      role: 'Founder & CEO', where: 'Belgium', date: '2012 → 2018 (exited)',
      body: 'IT services for political institutions. Web and mobile products, social platforms and digital engagement tools.',
      diff: [
        ['+', 'clients: European Parliament, major comms agencies'],
        ['+', 'reach: millions of European citizens'],
        ['+', 'team grown over 6 years'],
      ],
    },
  },
  {
    id: 'root', hash: '0000001', lane: 0, branch: 'main', refs: [],
    year: '····', msg: 'initial commit',
    parents: [],
    show: {
      date: '15+ years ago',
      body: 'Everything after this is a diff.',
      diff: [['+', 'curiosity'], ['+', 'a compiler']],
    },
  },
];

// Notes (formerly "posts"). Markdown-ish: blank-line separated paragraphs, "- " lists, "## " headings.
export const NOTES = [
  {
    slug: 'my-first-marathon', title: 'My first marathon', date: '2025-06-06',
    body: `After 6 months of prep, I arrived at the hotel I booked near Derby, UK. The race was the next morning at 9:00, a 20 minute drive from the hotel.

I put my gear in the room, went out for food and ate alone, which feels very strange (and nice) when you have a family with 4 kids.

Then I started preparing my "kit" for the next day. I had all sorts of stuff: running t-shirts, running shorts, hydration vest, 2 flasks, airband, anti-chafe paste, cap, sunglasses, electrolytes, you name it, and 🥁 no freaking running shoes except my Xero barefoot shoes… 🤬

No panic, it's 22:30. What are my options:

- Buy shoes? All the shops around are closed, it's Saturday evening.
- Go get my shoes from home? A round trip of more than 6h. That would cut my sleep way too much.
- Sleep, and find some shoes tomorrow at the race?
- Run in the barefoot shoes?

I chose to sleep and hope for shoes 🙏

In the morning I asked around on the big parking lot, but nobody had anything usable 😭 so I ran in the damn barefoot shoes. To be honest I had already run a 10K in the same style of barefoot shoes a few years before, so why not? But 42.2K?

Well, I survived. My feet didn't show any visible damage, but the left one hurt for a week!

Now I don't have a choice: I have to do another marathon with proper shoes. My time was not so good: 4h22 for the Tissington Trail Marathon, with 700 m of ascent and 706 m of descent.

I'm sure I can do better with proper shoes. Let's find out next time!

## Consistently good is better than occasionally great.`,
  },
  {
    slug: 'never-quit', title: 'Never quit!', date: '2024-02-27',
    body: `Today I'd like to talk about failing and quitting. A lot of people are afraid to fail. But failing is just a step towards succeeding. You don't fail until you quit, so think about that.

Take a toddler learning to walk. Can you imagine the toddler walking, falling twice, and then deciding: "okay, this walking thing is not for me. I quit." No. The toddler falls, so fails. Gets up again.

Smiles and starts again. And tries again. And again. And again and again.

Multiple times per day, again and again. And never quits. Until it walks. That's how you should approach any task you want to do in your life.

When you look at successful people, you only see their successes. You don't see the 100 times they failed before succeeding. But they did.

So in brief: you only fail when you quit. If you never quit, you never fail, because every failure before that is just an opportunity to learn.

## So never quit.`,
  },
  {
    slug: 'be-grateful', title: 'Be grateful!', date: '2024-02-22',
    body: `There are people who cannot walk.

There are people who are in jail and cannot even take a walk outside.

There are people who cannot even afford to buy running shoes.

There are people who have depression and cannot leave their beds.

There are people who have been in a wheelchair all their lives and have never walked or run.

## So be fucking grateful that you can do a running workout, man!`,
  },
  {
    slug: 'boredom', title: 'Boredom!', date: '2024-02-22',
    body: `Today I would like to talk about boredom.

In our modern society, we've engineered boredom out of our lives. We're not bored anymore.

People spend 13+ hours a day on their devices and screens. 100 years ago, that was zero hours. That's very new. If you are never bored, if you never spend time thinking by yourself, you're basically just repeating the ideas others have put inside you through their screens.

Boredom is good. It's good:

- for having good ideas
- for having less stress
- for going inwards

Steve Jobs said boredom was a tool he leveraged to create the products he did. And we know some of those products, right?

So please try to engineer boredom back into your life:

- Don't go on your phone for a little moment, on purpose.
- Don't listen to that podcast or music when you're walking or running.
- Spend maybe 5 minutes per day just sitting on your couch doing absolutely nothing.

Thank you.`,
  },
  {
    slug: 'the-comfort-crisis', title: 'The Comfort Crisis', date: '2024-02-21',
    body: `For 300K years (or almost 2M, depending how you count) we have been living a VERY HARD life.

We spent most of our time in harsh conditions, OUTSIDE. We had to fight for survival and hunt. So we evolved to survive those conditions, and these were all evolutionary advantages:

- eat a bit too much
- rest and enjoy comfort a bit too much
- solve problems a bit too much

But now we live in a world of abundance, and we are not made for it. Our instincts work AGAINST our best interest:

- Eating too much → 70% overweight or obese. We had to invent DIETS.
- Too much comfort → unhealthy. We invented the GYM to compensate for the lack of movement.
- Too much stuff → 10,000 items in the average house. Enter "minimalism".
- We like solving problems → we invent our own (pointless) ones…

The net result: we are unsatisfied and unhappy in all this comfort. We constantly move the goalposts, get "used to" comfort, then get dissatisfied again.

The solution is MORE HARSHNESS and LESS STUFF.

If you think you'll be happier with more stuff or an easier life, you are wrong. It's never going to work. It's an ever-moving target.`,
  },
];
