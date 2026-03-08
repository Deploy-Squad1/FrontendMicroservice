<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {emailApi}  from '../api.js'
const Email = ref('')
const Link = ref('')
const errorMessage = ref('')
const router = useRouter()
const handleInvitations = async () => {
  try {
    errorMessage.value = ''
    await emailApi.post('/send-invite', {
      to_email: Email.value,
      invite_link: Link.value
    })
    router.push('/map')
  } catch (error) {
    errorMessage.value = 'Failed to send invitation.'
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
        Send an invitation to a new member by entering their email and a unique link.
      </p>

      <form @submit.prevent="handleInvitations">
        <div class="mb-4">
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Email"
              v-model="Email"
              required
          />
        </div>
        <div class="mb-4">
          <input
              type="text"
              class="form-control bg-transparent border-secondary text-light shadow-none p-3"
              placeholder="Link"
              v-model="Link"
              required
          />
        </div>

        <p v-if="errorMessage" class="text-danger small text-center mb-4">{{ errorMessage }}</p>

        <button
            type="submit"
            class="btn btn-outline-warning w-100 text-uppercase fw-bold p-3"
            style="letter-spacing: 2px; color: #b1861f; border-color: #b1861f;"
        >
          Send Invitation
        </button>
      </form>
    </div>
  </div>
</template>
