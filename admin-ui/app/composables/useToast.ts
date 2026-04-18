import { ref } from 'vue'

const show = ref(false)
const message = ref('')
const color = ref('success')

export const useToastState = () => {
    return { show, message, color }
}

export const showToast = (msg: string, msgColor: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    message.value = msg
    color.value = msgColor
    show.value = true
}
