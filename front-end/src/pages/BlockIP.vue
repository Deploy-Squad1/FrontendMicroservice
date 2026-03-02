<script setup>
import {ref} from 'vue'
import {api} from '../api'
import router from "@/router/index.js";

const ipAddress = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const handleBlockIP = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    await api.post('/ip/block/', {ipAddress: ipAddress.value})
    successMessage.value = 'IP address has been blocked successfully.'
    ipAddress.value = ''
  } catch (error) {
    if(error.response.status === 400) {
      errorMessage.value = 'IP is already blocked.'
    } else {
      errorMessage.value = 'Something went wrong.'
      console.error(error)
    }
  }
}
</script>

<template>
  <div class="container-fluid bg-black d-flex justify-content-center align-items-center min-vh-100 font-monospace">
    <div class="card bg-dark border-secondary rounded-3 p-4 p-md-5" style="max-width: 500px; width: 100%;">

      <h2 class="text-warning text-uppercase fw-bold text-center mb-2"
          style="letter-spacing: 4px; color: #d4af37 !important;">
        Block IP
      </h2>

      <p class="text-secondary text-center mb-5 small">
        Enter an IP address below to add it to the blocklist.
      </p>

      <form @submit.prevent="handleBlockIP">
        <div>
          <label class="text-secondary small mb-2 d-block text-uppercase" style="letter-spacing: 1px;">
            IP Address
          </label>
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="0.0.0.0"
              v-model="ipAddress"
              pattern="^(((?!25?[6-9])[12]\d|[1-9])?\d\.?\b){4}$"
              title="Enter a valid IPv4 address"
              required
          />
        </div>

        <p :class="successMessage ? 'text-success' : 'text-danger'" class="small text-center mt-2 mb-3" style="min-height: 1.25em;">{{ successMessage || errorMessage }}&nbsp;</p>

        <button
            type="submit"
            class="btn btn-outline-dark w-100 text-uppercase fw-bold p-3"
            style="letter-spacing: 2px; color: #b1861f; border-color: #b1861f;"
        >
          Block IP
        </button>
      </form>
      <button
          class="btn border-secondary w-100 text-muted text-uppercase fw-bold p-3 mt-3"
          @click="router.push('/map')"
          style="letter-spacing: 2px;"
      >
        Return
      </button>
    </div>
  </div>
</template>
