export type Product = {
  id: string
  name: string
  price: number
  description: string
  category: string
  image_url: string
}

export type CustomerRequest = {
  id: string
  message: string
  created_at: string
  seen_at: string | null
}

