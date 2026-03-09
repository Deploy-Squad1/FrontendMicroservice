<script setup>
import {onMounted, ref} from 'vue'
import router from '@/router/index.js'
import {votingApi, api} from "@/api.js";

const errorMessage = ref('')
const votings = ref([])
const showModal = ref(false)
const users = ref([])

const newVotingForm = ref({
  poll_type: 'upgrade',
  target_username: '',
  target_user_id: null
})

const fetchUsers = async () => {
  try {
    const response = await api.get('/users/')
    users.value = response.data
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

const fetchVotings = async () => {
  try {
    const response = await votingApi.get('/polls')
    votings.value = response.data
  } catch (error) {
    if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to see votes (Silver or Gold role required).'
    } else {
      errorMessage.value = 'Failed to load votings.'
    }
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

  try {
    await votingApi.post(`/polls/${votingId}/vote`, {vote: choice})
  } catch (error) {
    if (error.response?.status === 409) {
      errorMessage.value = 'You already voted on this poll.'
    } else if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to vote (Silver or Gold role required).'
    }
    return
  }

  voting.user_vote = choice
  errorMessage.value = ''
  if (choice) {
    voting.votes_for++
  } else {
    voting.votes_against++
  }
}

const createVoting = async () => {
  try {
    errorMessage.value = ''

    if (newVotingForm.value.poll_type === 'kick' && !newVotingForm.value.target_username) {
      errorMessage.value = 'Please select a user to kick.'
      return
    }

    if (newVotingForm.value.poll_type === 'kick') {
      await votingApi.post(`/polls/kick/user/${newVotingForm.value.target_user_id}`)
    } else if (newVotingForm.value.poll_type === 'upgrade') {
      await votingApi.post('/polls/upgrade')
    }

    window.location.reload()
  } catch (error) {
    if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to create a voting.'
    } else {
      errorMessage.value = error.response.data
    }
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
        <div>
          <button
            class="btn btn-outline-secondary text-uppercase fw-bold px-4 py-2"
            @click="showModal = true; fetchUsers(); errorMessage = ''"
          >
            Create a new voting
          </button>

          <button
            class="btn btn-outline-secondary text-uppercase fw-bold px-4 py-2 ms-2"
            @click="router.push('/map')"
          >
            Return
          </button>
        </div>
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
              Yes({{voting.votes_for}})
            </button>
            <button
                class="btn btn-sm text-uppercase fw-bold"
                :style="voting.user_vote === false
                ? 'background-color: #6c757d; color: #fff; border-color: #6c757d; letter-spacing: 1px;'
                : 'background-color: transparent; color: #6c757d; border-color: #6c757d; letter-spacing: 1px;'"
                @click="castVote(voting.id, false)"
            >
              No({{voting.votes_against}})
            </button>
          </div>
        </li>
      </ul>

      <div
        class="modal fade"
        :class="{ 'show d-block': showModal }"
        tabindex="-1"
        :style="{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }"
      >
        <div class="modal-dialog">
          <div class="modal-content bg-dark border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title text-uppercase fw-bold" style="color: #d4af37;">
                Create a New Voting
              </h5>
            </div>
            <div class="modal-body">
              <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                {{ errorMessage }}
                <button type="button" class="btn-close btn-close-white" @click="errorMessage = ''" aria-label="Close"></button>
              </div>

              <div class="mb-3">
                <label for="pollType" class="form-label text-light fw-bold">Voting Type</label>
                <select
                  id="pollType"
                  v-model="newVotingForm.poll_type"
                  class="form-select bg-dark border-secondary text-light"
                >
                  <option value="upgrade">Promote Me</option>
                  <option value="kick">Kick User</option>
                </select>
              </div>

              <div v-if="newVotingForm.poll_type === 'kick'" class="mb-3">
                <label for="targetUser" class="form-label text-light fw-bold">Select User to Kick</label>
                <select
                  id="targetUser"
                  v-model="newVotingForm.target_username"
                  @change="() => {
                    const selectedUser = users.find(u => u.username === newVotingForm.target_username);
                    newVotingForm.target_user_id = selectedUser ? selectedUser.id : null;
                  }"
                  class="form-select bg-dark border-secondary text-light"
                >
                  <option value="">-- Select a user --</option>
                  <option
                    v-for="user in users"
                    :key="user.id"
                    :value="user.username"
                  >
                    {{ user.username }}
                  </option>
                </select>
              </div>
            </div>

            <div class="modal-footer border-secondary">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showModal = false; errorMessage.value = ''"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn fw-bold"
                style="background-color: #d4af37; color: #000;"
                @click="createVoting"
              >
                Create Voting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
