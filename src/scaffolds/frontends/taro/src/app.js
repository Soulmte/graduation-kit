import { createApp } from 'vue'
import './app.scss'

const App = createApp({
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
})

export default App
