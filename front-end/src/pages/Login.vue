<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import api from '../api'

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()

const handleLogin = async () => {
  try {
    errorMessage.value = ''
    const response = await api.post('/login/', {
      username: username.value,
      password: password.value
    })

    router.push('/map')
  } catch (error) {
    errorMessage.value = 'Invalid credentials.'
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
        Welcome back! Please enter your credentials to access the dashboard.
      </p>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Username"
              v-model="username"
              required
          />
        </div>
        <div class="mb-4">
          <input
              type="password"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Password"
              v-model="password"
              required
          />
        </div>

        <p v-if="errorMessage" class="text-danger small text-center mb-4">{{ errorMessage }}</p>

        <button
            type="submit"
            class="btn btn-outline-warning w-100 text-uppercase fw-bold p-3"
            style="letter-spacing: 2px; color: #b1861f; border-color: #b1861f;"
        >
          Login
        </button>
      </form>

      <div class="text-center mt-4">
        <router-link to="/register" class="text-secondary small">Don't have an account? Register</router-link>
      </div>
    </div>
  </div>
</template>
