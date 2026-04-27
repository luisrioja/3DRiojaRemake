import { useState, useEffect } from 'react';
import type { Service, PortfolioProject, Testimonial } from '../types';
import { getServices, getPortfolio, getTestimonials } from '../services/api';

export interface ApiData {
  services: Service[];
  servicesLoading: boolean;
  servicesError: string | null;
  projects: PortfolioProject[];
  projectsLoading: boolean;
  projectsError: string | null;
  testimonials: Testimonial[];
  testimonialsLoading: boolean;
  testimonialsError: string | null;
}

export function useApiData(): ApiData {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState<string | null>(null);

  useEffect(() => {
    getServices().then((res) => {
      if (res.success && res.data) {
        setServices(res.data);
      } else {
        setServicesError(res.error ?? 'Error al cargar servicios');
      }
      setServicesLoading(false);
    });

    getPortfolio().then((res) => {
      if (res.success && res.data) {
        setProjects(res.data);
      } else {
        setProjectsError(res.error ?? 'Error al cargar portfolio');
      }
      setProjectsLoading(false);
    });

    getTestimonials().then((res) => {
      if (res.success && res.data) {
        setTestimonials(res.data);
      } else {
        setTestimonialsError(res.error ?? 'Error al cargar testimonios');
      }
      setTestimonialsLoading(false);
    });
  }, []);

  return {
    services,
    servicesLoading,
    servicesError,
    projects,
    projectsLoading,
    projectsError,
    testimonials,
    testimonialsLoading,
    testimonialsError,
  };
}
