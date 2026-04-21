import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHeartPulse,
  faMoneyBills,
  faClock,
  faChartPie,
  faHand,
  faChevronLeft,
  faChevronRight,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import '@fortawesome/fontawesome-svg-core/styles.css'

config.autoAddCss = false

library.add(
  faHeartPulse,
  faMoneyBills,
  faClock,
  faChartPie,
  faHand,
  faChevronLeft,
  faChevronRight,
  faPlus,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
