export default function manifest() {
  return {
    name: 'Happy Belly',
    short_name: 'Happy Belly',
    description: 'Family meal planning made easy',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9D7B5',
    theme_color: '#E2A06F',
    icons: [
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
