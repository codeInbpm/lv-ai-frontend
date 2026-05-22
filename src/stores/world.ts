import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../utils/request'

export interface Inspiration {
  id: number
  month: number
  title: string
  subtitle: string
  coverUrl: string
  recommendCount: number
  destinationId?: number  // 后端关联的目的地ID（执行补丁SQL后有值）
}

export interface Broadcast {
  id: number
  content: string
}

export interface Destination {
  id: number
  name: string
  description: string
  imageUrl: string
  tags?: string
  isHot: boolean
  lat?: number
  lng?: number
  spots?: DestinationSpot[]
  foods?: DestinationFood[]
}

export interface DestinationSpot {
  id: number
  name: string
  score: number
  commentCount: number
  tags: string
  openTime: string
  ticketInfo: string
  address: string
  imageUrl: string
  lat: number
  lng: number
  rankInfo: string
}

export interface DestinationFood {
  id: number
  name: string
  score: number
  tags: string
  imageUrl: string
  averageCost: number
}

export interface Topic {
  id: number
  title: string
  coverUrl: string
  followerCount: number
}

export const useWorldStore = defineStore('world', () => {
  const inspirations = ref<Inspiration[]>([])
  const broadcasts = ref<Broadcast[]>([])
  const hotDestinations = ref<Destination[]>([])
  const hotTopics = ref<Topic[]>([])
  const currentDestination = ref<Destination | null>(null)

  async function fetchInspirations(month: number) {
    const res = await http.get<Inspiration[]>('/world/inspirations', { month })
    inspirations.value = res
  }

  async function fetchBroadcasts() {
    const res = await http.get<Broadcast[]>('/world/broadcast')
    broadcasts.value = res
  }

  async function fetchHotDestinations() {
    const res = await http.get<Destination[]>('/world/destinations/hot')
    hotDestinations.value = res
  }

  async function fetchHotTopics() {
    const res = await http.get<Topic[]>('/world/topics/hot')
    hotTopics.value = res
  }

  async function fetchDestinationDetail(id: number) {
    const res = await http.get<Destination>(`/world/destination/${id}`)
    currentDestination.value = res
  }

  return {
    inspirations,
    broadcasts,
    hotDestinations,
    hotTopics,
    currentDestination,
    fetchInspirations,
    fetchBroadcasts,
    fetchHotDestinations,
    fetchHotTopics,
    fetchDestinationDetail
  }
})
