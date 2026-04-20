// Direct axios client for backend calls that bypass /next-api/ routes
// (public endpoints: resend-verification, upgrade-plan, AWS, etc.)
import config from '@/config'
import axios from 'axios'

const http = axios.create({
    baseURL: config.api.baseURL,
    headers: { 'Content-Type': 'application/json' },
})

export default http
