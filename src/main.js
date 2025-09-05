import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 引入 Vant 组件
import { 
  Button, 
  Circle, 
  Card, 
  Toast, 
  Loading, 
  Dialog, 
  Image as VanImage 
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

// 注册 Vant 组件
app.use(Button)
app.use(Circle)
app.use(Card)
app.use(Toast)
app.use(Loading)
app.use(Dialog)
app.use(VanImage)

app.mount('#app')