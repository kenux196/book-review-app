import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useBookStore } from './stores/book'

import './assets/main.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const bookStore = useBookStore(pinia)
  await bookStore.initialize()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
