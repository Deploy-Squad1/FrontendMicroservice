<script setup>
import {ref} from "vue";
import {useRouter} from 'vue-router'
import {api} from '../api.js'

const router = useRouter()
const passCode = ref('')
const errorMessage = ref('')
const handleEnter = async () => {
  try {
    errorMessage.value = ''
    await api.post('/passcode/verify/', {passcode: passCode.value})
    sessionStorage.setItem('passcode', passCode.value)
    router.push('/login/')
  } catch (error) {
    errorMessage.value = 'Invalid passcode or expired.'
    console.error(error)
  }
}
</script>
<template>
  <div class="container-fluid bg-black d-flex justify-content-center align-items-center min-vh-100 font-monospace">
    <div class="card bg-dark border-secondary rounded-3 p-4 p-md-5" style="max-width: 500px; width: 100%;">

      <h2 class="text-warning text-uppercase fw-bold text-center mb-4"
          style="letter-spacing: 4px; color: #d4af37 !important;">
        The Order
      </h2>

      <p class="text-secondary text-center mb-5 small">
        Enter the daily passcode to proceed.
      </p>

      <form @submit.prevent="handleEnter">
        <div class="mb-4">
          <input
              type="password"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Passcode"
              v-model="passCode"
              required
          />
        </div>

        <p v-if="errorMessage" class="text-danger small text-center mb-4">{{ errorMessage }}</p>

        <button
            type="submit"
            class="btn btn-outline-warning w-100 text-uppercase fw-bold p-3"
            style="letter-spacing: 2px; color: #b1861f; border-color: #b1861f;"
        >
          Enter
        </button>
      </form>

    </div>
  </div>
</template>
