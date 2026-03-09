<script setup>
import{ref, shallowRef, onMounted, watch, nextTick} from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {useRouter} from 'vue-router';
import {api, mapApi} from '../api.js';

const router = useRouter();

const map = shallowRef(null);
let markerGroup = null;

const artifacts = ref([]);

const showForm = ref(false);
const newArtifact = ref({name: '', category: 'other', lat: 0, lng: 0});

const showDeleteModal = ref(false);
const showDeleteAllModal = ref(false);
const artifactToDelete = ref(null);


const showArtifactSidebar = ref(false);
const selectedArtifact = ref(null);
const photoFile = ref(null);


const selectedFilter = ref('');

const errorMessage = ref('');

const userRole = localStorage.getItem('role')

const categoryIcons = {
  ghost: L.divIcon({
    html: '<div style="font-size: 32px;">👻</div>',
    className: 'custom-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  }),
  alien: L.divIcon({
    html: '<div style="font-size: 32px;">👽</div>',
    className: 'custom-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  }),
  yeti: L.divIcon({
    html: '<div style="font-size: 32px;">🥶</div>',
    className: 'custom-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  }),
  other: L.divIcon({
    html: '<div style="font-size: 32px;">📍</div>',
    className: 'custom-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
};

onMounted(async () => {
  map.value = L.map('map').setView([49.8419, 24.0315], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
  }).addTo(map.value);

  markerGroup = L.layerGroup().addTo(map.value);

  map.value.on('click', (e) => {
    errorMessage.value = '';
    newArtifact.value.lat = e.latlng.lat;
    newArtifact.value.lng = e.latlng.lng;
    newArtifact.value.name = '';
    newArtifact.value.category = 'other';
    showForm.value = true;
  });

  await fetchArtifacts();
});

watch(selectedFilter, async () => {
  await fetchArtifacts();
});

const fetchArtifacts = async () => {
  errorMessage.value = '';
  try {
    let url = '/artifacts';
    if (selectedFilter.value !== '') {
      url += `?category=${selectedFilter.value}`;
    }

    const response = await mapApi.get(url);
    artifacts.value = response.data;

    markerGroup.clearLayers();

    artifacts.value.forEach(artifact => {
      addMarkerToMap(artifact);
    });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    errorMessage.value = 'Unable to load artifacts. Please try refreshing the page.';
  }
};

const submitArtifact = async () => {
  errorMessage.value = '';

  if (!newArtifact.value.name.trim()) {
    errorMessage.value = "Please enter a name for the artifact.";
    return;
  }

  try {
    const request = {
      name: newArtifact.value.name,
      lat: newArtifact.value.lat,
      lng: newArtifact.value.lng,
      category: newArtifact.value.category,
    };

    const response = await mapApi.post('/artifacts', request);

    if (selectedFilter.value === '' || selectedFilter.value === response.data.category) {
      addMarkerToMap(response.data);
    }
    showForm.value = false;
  } catch (error) {
    console.error('Error creating artifact:', error);
    if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to create a tag (Silver or Gold role required).';
    } else {
      errorMessage.value = 'Unable to save the artifact. Please try again.';
    }
  }
};

const confirmDeleteAll = async () => {
  errorMessage.value = '';
  try {
    await api.delete('/database/delete/');
    await handleLogout();
  } catch (error) {
    console.error('Error deleting all artifacts:', error);
    if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to delete all data (Gold role required).';
    } else {
      errorMessage.value = 'Unable to delete the data.';
    }
    showDeleteAllModal.value = false;
  }
};

const addMarkerToMap = (artifact) => {
  const icon = categoryIcons[artifact.category] || categoryIcons['other'];

  const marker = L.marker([artifact.lat, artifact.lng], {icon: icon}).addTo(markerGroup);
  artifact.marker = marker;

  marker.on('click', async () => {
    errorMessage.value = '';
    selectedArtifact.value = artifact;
    showArtifactSidebar.value = true;

    await nextTick();
    map.value.invalidateSize();
    map.value.panTo([artifact.lat, artifact.lng]);
  });
};

const DeleteFromSidebar = () => {
  errorMessage.value = '';
  artifactToDelete.value = {
    id: selectedArtifact.value.id,
    name: selectedArtifact.value.name,
    marker: selectedArtifact.value.marker
  };
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!artifactToDelete.value) return;
  errorMessage.value = '';

  try {
    const idToDelete = artifactToDelete.value.id;

    await mapApi.delete(`/artifacts/${idToDelete}`);

    markerGroup.removeLayer(artifactToDelete.value.marker);

    showDeleteModal.value = false;

    if (selectedArtifact.value?.id === idToDelete) {
      closeSidebar();
    }

    artifactToDelete.value = null;
  } catch (error) {
    console.error('Error deleting artifact:', error);
    if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to delete this artifact (Gold role required).';
    } else {
      errorMessage.value = 'Unable to remove artifact. Check connection.';
    }
    showDeleteModal.value = false;
  }
};

const closeSidebar = async () => {
  showArtifactSidebar.value = false;
  selectedArtifact.value = null;
  photoFile.value = null;

  await nextTick();
  map.value.invalidateSize();
};

const handleFileSelect = (event) => {
  photoFile.value = event.target.files[0];
};

const uploadPhoto = async () => {
  if (!photoFile.value || !selectedArtifact.value) return;
  errorMessage.value = '';

  const formData = new FormData();
  formData.append('photo', photoFile.value);

  try {
    const response = await mapApi.post(`/artifacts/${selectedArtifact.value.id}/photo`, formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    });

    selectedArtifact.value.photo_url = response.data.photo_url;
    photoFile.value = null;
  } catch (error) {
    console.error('Upload error:', error);
    if (error.response?.status === 403) {
      errorMessage.value = 'Access Denied: Only the creator of this artifact can upload an evidence photo!';
    } else {
      errorMessage.value = 'Failed to upload photo. File might be too large.';
    }
  }
};

const toggleConfirmation = async () => {
  if (!selectedArtifact.value) return;
  errorMessage.value = '';

  if (selectedArtifact.value.has_confirmed) {
    try {
      await mapApi.delete(`/artifacts/${selectedArtifact.value.id}/unconfirm`);

      selectedArtifact.value.confirmations = Math.max(0, (selectedArtifact.value.confirmations || 0) - 1);
      selectedArtifact.value.has_confirmed = false;
    } catch (error) {
      console.error('Error removing confirmation:', error);
      errorMessage.value = 'Failed to remove confirmation.';
    }
  } else {
    try {
      await mapApi.post(`/artifacts/${selectedArtifact.value.id}/confirm`);

      selectedArtifact.value.confirmations = (selectedArtifact.value.confirmations || 0) + 1;
      selectedArtifact.value.has_confirmed = true;
    } catch (error) {
      if (error.response?.status === 409) {
        selectedArtifact.value.has_confirmed = true;
        errorMessage.value = 'You already confirmed this finding. Click again if you want to remove it.';
      } else if (error.response?.status === 403) {
        errorMessage.value = 'You cannot confirm your own artifact!';
      } else {
        errorMessage.value = 'Failed to confirm artifact.';
      }
    }
  }
};

const handleLogout = async () => {
  try {
    await api.post('/logout/', {});
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    router.push('/');
  }
};
</script>

<template>
  <div class="container-fluid bg-black d-flex justify-content-center align-items-center min-vh-100 font-monospace">
    <div class="container-fluid px-4 mt-4 position-relative">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Map of artifacts</h2>

        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center">
            <label class="me-2 fw-bold">Filter:</label>
            <select v-model="selectedFilter" class="form-select bg-dark text-light border-secondary"
                    style="width: auto;">
              <option value="">All Categories</option>
              <option value="yeti">Yetti</option>
              <option value="ghost">Ghost</option>
              <option value="alien">Alien</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
              class="btn border-secondary text-muted"
              @click="router.push('/voting')"
              style="border-color: #b1861f; color: #b1861f;"
          >
            Votings
          </button>

          <button class="btn border-secondary text-muted" @click="router.push('/block-ip')"
                  style="border-color: #b1861f; color: #b1861f;">
            Block IP
          </button>

          <button
              v-if="userRole === 'Gold'"
              class="btn btn-outline-danger"
              @click="showDeleteAllModal = true"
          >
            Delete All Data
          </button>

          <button class="btn border-secondary text-muted" @click="router.push('/send-invite')"
                  style="border-color: #b1861f; color: #b1861f;">
            Send Invite
          </button>

          <button
              class="btn btn-outline-warning"
              @click="handleLogout"
              style="border-color: #b1861f; color: #b1861f;"
          >
            Logout
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''" aria-label="Close"></button>
      </div>

      <div class="d-flex w-100 bg-dark"
           style="height: 700px; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(0,0,0,0.5); border: 1px solid #333;">

        <div
            v-if="showArtifactSidebar && selectedArtifact"
            class="h-100 bg-dark text-light d-flex flex-column flex-shrink-0"
            style="width: 380px; border-right: 2px solid #b1861f; z-index: 2;"
        >
          <div class="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary"
               style="background-color: #1a1a1a;">
            <h5 class="mb-0 text-warning text-truncate" style="max-width: 70%;">Name: {{ selectedArtifact.name }}</h5>
            <div class="d-flex align-items-center">
              <button type="button" class="btn btn-sm btn-outline-danger me-3" @click="DeleteFromSidebar"
                      style="padding: 0.1rem 0.4rem;" title="Delete Artifact">Delete
              </button>
              <button type="button" class="btn-close btn-close-white" @click="closeSidebar" aria-label="Close"></button>
            </div>
          </div>

          <div class="p-4 flex-grow-1 d-flex flex-column" style="overflow-y: auto;">
            <div class="mb-4">
            <span class="text-secondary small d-block">Category: <span
                class="text-light fw-bold">{{ selectedArtifact.category }}</span></span>
              <span class="text-secondary small d-block">Coordinates: <span
                  class="text-light">{{ selectedArtifact.lat.toFixed(4) }}, {{
                  selectedArtifact.lng.toFixed(4)
                }}</span></span>
            </div>

            <div v-if="selectedArtifact.photo_url" class="mb-4 text-center">
              <img :src="selectedArtifact.photo_url" alt="Artifact Evidence"
                   class="img-fluid rounded border border-secondary"
                   style="width: 100%; max-height: 350px; object-fit: cover;">
            </div>

            <div v-else class="mb-4 p-3 border border-secondary rounded bg-secondary bg-opacity-25">
              <label class="form-label text-light small fw-bold mb-2">Upload Evidence:</label>
              <input type="file" class="form-control form-control-sm bg-dark text-light border-secondary mb-3"
                     accept="image/*" @change="handleFileSelect">
              <button class="btn btn-outline-warning btn-sm w-100 fw-bold" @click="uploadPhoto" :disabled="!photoFile"
                      style="border-color: #b1861f; color: #b1861f;">
                Upload picture
              </button>
            </div>

            <div class="mt-auto"></div>

            <div class="pt-3 border-top border-secondary">
              <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-light fs-6 ">
                <strong>Confirmations:</strong> <strong class="text-warning fs-5">{{
                  selectedArtifact.confirmations || 0
                }}</strong>
              </span>
              </div>

              <button
                  class="btn w-100 fw-bold shadow-sm p-2"
                  :class="selectedArtifact.has_confirmed ? 'btn-outline-danger' : 'btn-warning'"
                  @click="toggleConfirmation"
                  :style="selectedArtifact.has_confirmed ? '' : 'background-color: #b1861f; color: white; border: none; letter-spacing: 0.5px;'"
              >
                {{ selectedArtifact.has_confirmed ? 'REMOVE CONFIRMATION' : 'VERIFY FINDING' }}
              </button>
            </div>
          </div>
        </div>

        <div id="map" class="flex-grow-1 h-100" style="z-index: 1;"></div>

      </div>

      <div
          v-if="showForm"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style="background: rgba(0, 0, 0, 0.6); z-index: 1000; border-radius: 8px;"
      >
        <div class="card bg-dark text-light shadow-lg" style="width: 22rem; border: 1px solid #444;">
          <div class="card-body">
            <h4 class="card-title text-warning mb-1">New artifact</h4>
            <p class="card-text text-secondary mb-3" style="font-size: 0.85rem;">
              Coordinates: {{ newArtifact.lat.toFixed(4) }}, {{ newArtifact.lng.toFixed(4) }}
            </p>

            <div class="mb-3">
              <label class="form-label">Name:</label>
              <input
                  v-model="newArtifact.name"
                  type="text"
                  class="form-control bg-secondary text-light border-0"
                  placeholder="Example: Snowy Footprint"
              />
            </div>

            <div class="mb-4">
              <label class="form-label">Category:</label>
              <select v-model="newArtifact.category" class="form-select bg-secondary text-light border-0">
                <option value="yeti">Yetti</option>
                <option value="ghost">Ghost</option>
                <option value="alien">Alien</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="d-flex justify-content-between">
              <button class="btn btn-outline-secondary text-light" @click="showForm = false">Cancel</button>
              <button class="btn btn-outline-warning" @click="submitArtifact"
                      style="border-color: #b1861f; color: #b1861f;">Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
          v-if="showDeleteModal"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style="background: rgba(0, 0, 0, 0.7); z-index: 1000; border-radius: 8px;"
      >
        <div class="card bg-dark text-light shadow-lg text-center p-3" style="width: 20rem; border: 1px solid #b1861f;">
          <div class="card-body">
            <h4 class="text-warning mb-3">Delete Artifact?</h4>
            <p>Are you sure you want to delete <b>"{{ artifactToDelete?.name }}"</b>?</p>
            <p class="text-secondary" style="font-size: 0.85rem;">This action cannot be undone.</p>

            <div class="d-flex justify-content-center gap-3 mt-4">
              <button class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
              <button class="btn btn-outline-warning" @click="confirmDelete"
                      style="border-color: #b1861f; color: #b1861f;">Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
          v-if="showDeleteAllModal"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style="background: rgba(0, 0, 0, 0.7); z-index: 1000; border-radius: 8px;"
      >
        <div class="card bg-dark text-light shadow-lg text-center p-3" style="width: 22rem; border: 1px solid #dc3545;">
          <div class="card-body">
            <h4 class="text-danger mb-3">Delete All Data?</h4>
            <p>You are about to <b>permanently delete all data</b> of the website.</p>

            <div class="d-flex justify-content-center gap-3 mt-4">
              <button class="btn btn-secondary" @click="showDeleteAllModal = false">Cancel</button>
              <button class="btn btn-danger" @click="confirmDeleteAll">Yes, Delete All</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
