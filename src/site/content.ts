// Website text. Edit here to change what the public pages say.
// Taken from alfurqan.ie (Nov 2026) where that text was real.

export const SITE = {
  name: 'Masjid Al-Furqan',
  org: 'Al Furqan Community Association',
  arabicName: 'مسجد الفرقان',
  tagline: 'Serving the Muslim community of Limerick',
  address: 'Unit 1, Windmill Street, Limerick, V94 X392, Ireland',
  phone: '+353 89 225 9937',
  phoneHref: 'tel:+353892259937',
  email: '', // not yet confirmed (alfurqan.ie shows a placeholder)
  whatsapp: 'https://chat.whatsapp.com/IPdUcxaNsjyFQ5RMLtEvYN',
  stripe: 'https://donate.stripe.com/14kg0o9m60b78mY9AA',
  mapQuery: 'Unit 1, Windmill Street, Limerick, V94 X392',
  youtube: 'https://www.youtube.com/@AlFurqanLimerick',
  charity: {
    line: 'Al-Furqan Community Association is a trading name of Dublin Welfare Society',
    chy: 'CHY19290',
    rcn: '20075477',
    link: 'https://dublinwelfaresociety.ie/',
  },
  bank: { name: 'Bank of Ireland (BOI)', iban: 'IE36 BOFI 9043 0983 4507 78', bic: 'BOFIIE2D' },
  appeal: {
    active: true,
    title: 'Mosque Extension Project',
    target: 600000,
    raised: 470000,
    summary:
      'Help us raise €600,000 to purchase the gym area within our premises and expand our place of worship for the growing Muslim community in Limerick.',
  },
};

export const NAV = [
  { href: '', label: 'Home' },
  { href: 'timetable/', label: 'Prayer Times' },
  { href: 'about/', label: 'About' },
  { href: 'services/', label: 'Services' },
  { href: 'project/', label: 'Extension Project' },
  { href: 'donate/', label: 'Donate' },
  { href: 'contact/', label: 'Contact' },
];

export const HADITH = {
  home: { text: 'Whoever builds a mosque for Allah, Allah will build for him a house like it in Paradise.', source: 'Bukhari' },
  about: { text: 'Whenever someone goes to the mosque in the morning or evening, Allah prepares for him a place in Paradise.', source: 'Bukhari and Muslim' },
  services: { text: 'The best of you are those who learn the Quran and teach it.', source: 'Bukhari' },
  donate: { text: 'Save yourself from Hell-fire even by giving half a date-fruit in charity.', source: 'Bukhari' },
};

export const ABOUT = [
  'Al Furqan Community Association is a vibrant and dedicated Muslim organisation serving the Muslim community of Limerick, Ireland. Established with the goal of fostering a strong, cohesive and supportive environment, the association plays a pivotal role in the spiritual, social and educational development of its members and the community at large.',
  'Located in the heart of Limerick City, our association is a hub for cultural exchange, community support and religious guidance. We are committed to promoting the principles and values of Islam while embracing the rich diversity of our community. Through a wide range of activities, including prayer services, educational programmes, community events and charitable initiatives, we aim to enhance the well-being of all our members and foster a sense of unity and belonging.',
  'We are dedicated to building bridges between the Muslim community and the wider Irish society, encouraging mutual respect, understanding and cooperation. By upholding the principles of compassion, integrity and charity, Al Furqan Community Association strives to be a beacon of hope and a source of strength for the Muslim community in Limerick.',
];

export const SERVICES = [
  {
    title: 'Daily prayers & Jumu’ah',
    text: 'Five daily congregational prayers and Friday Jumu’ah with khutbah. See the prayer timetable for jamaat times.',
    icon: 'mosque',
  },
  {
    title: 'Quran & Tarbiyyah classes',
    text: 'Quran recitation and memorisation, Islamic values and tarbiyyah for children and young people.',
    icon: 'book',
  },
  {
    title: 'Religious lectures',
    text: 'Regular lectures and reminders for the community. Announcements are shared in the WhatsApp group.',
    icon: 'lecture',
  },
  {
    title: 'Physical education & gym',
    text: 'Physical education and gym sessions for the community.',
    icon: 'gym',
  },
  {
    title: 'Ramadan',
    text: 'Taraweeh prayers, a Ramadan timetable with suhoor and iftar times, and Eid prayers.',
    icon: 'moon',
  },
];

export const PROJECT = {
  intro:
    'The Prophet (peace be upon him) said: “Whoever builds a mosque, desiring thereby Allah’s pleasure, Allah builds for him the like of it in Paradise.” [Bukhari]',
  appeal:
    'Masjid Al Furqan is seeking your immediate support to raise €600,000 for the purchase of the gym area within our premises. The primary goal of this project is to expand the space for worship, as our growing Muslim community in Limerick has outgrown the current facility, which is no longer sufficient or sustainable for future growth.',
  why: [
    ['Increased capacity', 'Our community is rapidly expanding, and the current space cannot accommodate the increasing number of worshippers, especially during Jumu’ah, Eid and other large gatherings.'],
    ['Future sustainability', 'Purchasing the gym area will provide the much-needed space to comfortably serve the community, ensuring a safe and welcoming environment for prayer and community events.'],
    ['Strengthening the community', 'With this expanded space we can offer more services, including educational programmes, community activities and youth engagement initiatives, all centred around faith and worship.'],
  ],
  how: 'Every contribution, big or small, brings us closer to securing a larger, more accommodating place of worship for our growing community. You can donate online, by bank transfer, or in person at the masjid.',
};

export const DONATE = {
  intro:
    'At Masjid Al Furqan we are dedicated to serving our community, providing a space for worship, education and spiritual growth. Your donations help us maintain the masjid, expand our programmes and assist those in need.',
  why: [
    ['Maintain and improve the masjid', 'Ensuring a welcoming environment for all who come to pray and learn.'],
    ['Fund educational programmes', 'Quran and Islamic studies classes, youth programmes and community education.'],
    ['Help those in need', 'Assistance for families facing financial hardship through zakat and charity programmes.'],
    ['Expand community services', 'More activities including health, fitness, youth programmes and religious gatherings.'],
  ],
  ways: [
    ['One-time donation', 'Use the Donate online button.'],
    ['Monthly donation', 'Set up a standing order using the bank details.'],
    ['Zakat and Sadaqah', 'Fulfil your obligation and help those in need.'],
    ['Project-specific donation', 'Mention the extension project, youth programmes or education in your transfer reference.'],
  ],
};
