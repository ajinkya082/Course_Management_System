/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        homeHeadingSmall: ['28px', '34px'],
        homeHeadingLarge: ['48px', '56px'],
        courseDetailsHeadingSmall: ['26px', '36px'],
        courseDetailsHeadingLarge: ['36px', '46px'],
      },

      gridTemplateColumns: {
        auto: 'repeat(auto-fit, minmax(200px, 1fr))',
      },

      height: {
        'section-height': '500px',
      },

      zIndex: {
        '-1': '-1',
      },
      maxWidth:{
        'course-card' :'424px'
      },
      boxShadow:{
        'custom-card' : '0px 4px 15px 2px rgba(0, 0, 0, 0.1)',
      } 
    },
  },
  plugins: [],
}
