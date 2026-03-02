<script setup>
import{ref, shallowRef, onMounted, watch} from 'vue';
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
const artifactToDelete = ref(null);

const selectedFilter = ref('');

const errorMessage = ref('');

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

const addMarkerToMap = (artifact) => {
  const icon = categoryIcons[artifact.category] || categoryIcons['other'];

  const marker = L.marker([artifact.lat, artifact.lng], {icon: icon}).addTo(markerGroup);

  marker.bindPopup(`
    <b>${artifact.name}</b><br>
    Category: ${artifact.category}<br>
    Coordinates: ${artifact.lat.toFixed(4)}, ${artifact.lng.toFixed(4)}
  `);

  marker.on('contextmenu', () => {
    errorMessage.value = '';
    artifactToDelete.value = {id: artifact.id, name: artifact.name, marker: marker};
    showDeleteModal.value = true;
  });
};

const confirmDelete = async () => {
  if (!artifactToDelete.value) return;
  errorMessage.value = '';

  try {
    await mapApi.delete(`/artifacts/${artifactToDelete.value.id}`);

    markerGroup.removeLayer(artifactToDelete.value.marker);

    showDeleteModal.value = false;
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

const handleLogout = async () => {
  try {
    await api.post('/logout/', {});
    localStorage.removeItem('isAuthenticated');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    router.push('/');
  }
};
</script>

<template>
  <div class="container mt-4 position-relative">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Map of artifacts</h2>

      <div class="d-flex align-items-center gap-3">
        <div class="d-flex align-items-center">
          <label class="me-2 fw-bold">Filter:</label>
          <select v-model="selectedFilter" class="form-select bg-dark text-light border-secondary" style="width: auto;">
            <option value="">All Categories</option>
            <option value="yeti">Yetti</option>
            <option value="ghost">Ghost</option>
            <option value="alien">Alien</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
            class="btn border-secondary text-muted"
            @click="router.push('/block-ip')"
            style="border-color: #b1861f; color: #b1861f;"
        >
          Block IP
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

    <div id="map" style="height: 800px; width: 100%; border-radius: 8px; z-index: 1;"></div>

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

  </div>
</template>
