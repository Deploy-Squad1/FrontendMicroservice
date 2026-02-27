<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {api} from '../api.js'

const router = useRouter()
const formData = ref({
  username: '',
  password: '',
  email: '',
  confirmPassword: ''
})
const errorMessage = ref('')

const handleRegister = async () => {
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = "Passwords do not match!"
    return
  }

  try {
    errorMessage.value = ''
    await api.post('/registration/', {
      username: formData.value.username,
      password: formData.value.password,
      email: formData.value.email
    })
    alert('Request submitted. You may now login.')
    router.push('/login')
  } catch (error) {
    errorMessage.value = 'Failed to register. User may already exist.'
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
        Create a new account to access the dashboard.
      </p>

      <form @submit.prevent="handleRegister">
        <div class="mb-4">
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Username"
              v-model="formData.username"
              required
          />
        </div>
        <div class="mb-4">
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Email"
              v-model="formData.email"
              required
          />
        </div>
        <div class="mb-4">
          <input
              type="password"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Password"
              v-model="formData.password"
              required
          />
        </div>
        <div class="mb-4">
          <input
              type="password"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Confirm Password"
              v-model="formData.confirmPassword"
              required
          />
        </div>

        <p v-if="errorMessage" class="text-danger small text-center mb-4">{{ errorMessage }}</p>

        <button
            type="submit"
            class="btn btn-outline-warning w-100 text-uppercase fw-bold p-3"
            style="letter-spacing: 2px; color: #b1861f; border-color: #b1861f;"
        >
          Register
        </button>
      </form>

    </div>
  </div>
</template>
