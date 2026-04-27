export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export interface PortfolioInput {
  title: string;
  description: string;
  image: string;
}

export interface ServiceInput {
  title: string;
  description: string;
  icon: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
