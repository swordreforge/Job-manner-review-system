import { createApp } from 'vue'
import { createPinia } from 'pinia'

import vuetify from './plugins/vuetify'

import App from './App.vue'
import router from './router'

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app')
