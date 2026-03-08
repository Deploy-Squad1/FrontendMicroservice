<script setup>
import {onMounted, ref} from 'vue'
import router from '@/router/index.js'
import {votingApi} from "@/api.js";

const errorMessage = ref('')
const votings = ref([])

const fetchVotings = async () => {
  try {
    const response = await votingApi.get('/polls')
    votings.value = response.data
  } catch (err) {
    errorMessage.value = 'Failed to load votings.'
  }

  votings.value.map(function (voting) {
    if(voting.poll_type === "upgrade"){
      voting.title = `Promote user ${ voting.target_username }`
    } else if(voting.poll_type === "kick") {
      voting.title = `Kick user ${ voting.target_username }`
    }
    return voting
  })
}

const castVote = async (votingId, choice) => {
  const voting = votings.value.find(v => v.id === votingId)
  if (!voting) return

  if (voting.user_vote === choice) {
    // Remove user vote api call
    // ...

    voting.user_vote = null
  } else {
    // Add user vote api call
    // ...

    voting.user_vote = choice
  }
}

onMounted(fetchVotings)
</script>

<template>
  <div class="container-fluid bg-black min-vh-100 font-monospace py-5 px-3">
    <div class="mx-auto" style="max-width: 800px;">

      <div class="d-flex justify-content-between align-items-center mb-5">
        <h2
            class="text-uppercase fw-bold mb-0"
            style="letter-spacing: 4px; color: #d4af37;"
        >
          Active Votings
        </h2>
        <button
            class="btn border-secondary text-muted text-uppercase fw-bold px-4 py-2"
            style="letter-spacing: 2px;"
            @click="router.push('/map')"
        >
          Return
        </button>
      </div>

      <p v-if="errorMessage" class="text-danger small text-center mb-4">{{ errorMessage }}</p>

      <div v-if="votings.length === 0 && !errorMessage" class="text-center text-secondary py-5">
        <p class="small text-uppercase" style="letter-spacing: 2px;">No active votings at the moment.</p>
      </div>

      <ul v-else class="list-unstyled d-flex flex-column gap-3">
        <li
            v-for="voting in votings"
            :key="voting.id"
            class="card bg-dark border-secondary rounded-3 p-4"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="fw-bold mb-0" style="color: #d4af37;">{{ voting.title }}</h5>
          </div>

          <p class="text-secondary small mb-3">{{ voting.description }}</p>

          <div class="text-muted small mb-3">
            Ends: {{ new Date(voting.expires_at).toLocaleString() }}
          </div>

          <div class="d-flex gap-2 mt-1">
            <button
                class="btn btn-sm text-uppercase fw-bold"
                :style="voting.user_vote === true
                ? 'background-color: #b1861f; color: #000; border-color: #b1861f; letter-spacing: 1px;'
                : 'background-color: transparent; color: #b1861f; border-color: #b1861f; letter-spacing: 1px;'"
                @click="castVote(voting.id, true)"
            >
              Yes
            </button>
            <button
                class="btn btn-sm text-uppercase fw-bold"
                :style="voting.user_vote === false
                ? 'background-color: #6c757d; color: #fff; border-color: #6c757d; letter-spacing: 1px;'
                : 'background-color: transparent; color: #6c757d; border-color: #6c757d; letter-spacing: 1px;'"
                @click="castVote(voting.id, false)"
            >
              No
            </button>
          </div>
        </li>
      </ul>

    </div>
  </div>
</template>
