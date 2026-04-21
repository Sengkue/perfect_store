// https://nuxt.com/docs/api/configuration/nuxt-config
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Duplicated imports "useAppConfig"')) {
    return;
  }
  originalWarn(...args);
};

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  css: ['~/assets/css/main.css'],
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  modules: [
    'vuetify-nuxt-module'
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api'
    }
  },
  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      /* vuetify options */
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            colors: {
              primary: '#1976D2',
              secondary: '#424242',
              accent: '#82B1FF',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
              background: '#F5F7FA'
            }
          }
        }
      },
      typography: {
        fontFamily: '"Noto Sans Lao", sans-serif'
      }
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        'xlsx',
        'file-saver'
      ]
    }
  }
})
