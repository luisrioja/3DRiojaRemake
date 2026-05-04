#!/usr/bin/env node

/**
 * 3DRioja Google Maps Review Scraper
 *
 * Scrapes reviews from the 3DRioja Google Maps listing and updates
 * server/data/testimonials.json with the latest reviews.
 *
 * Usage:
 *   node scripts/scrape-reviews.mjs
 *
 * Set up as a monthly cron job:
 *   0 9 1 * * cd /path/to/3DRiojaRemake && node scripts/scrape-reviews.mjs
 *
 * Or run from the Raspberry Pi:
 *   ssh pi@192.168.1.35 "cd /path/to/3DRiojaRemake && node scripts/scrape-reviews.mjs"
 */

import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TESTIMONIALS_PATH = resolve(__dirname, '../server/data/testimonials.json');

// 3DRioja Google Maps Place ID — used for the Places API (New)
// URL: https://maps.app.goo.gl/K9djyHA7WikZcRP7A
const PLACE_NAME = '3DRioja';
const MAPS_URL = 'https://www.google.com/maps/place/3DRioja';

/**
 * Scrape reviews using Google Maps public page.
 *
 * IMPORTANT: This uses a simple text extraction approach.
 * Google's HTML structure changes frequently, so this may need
 * adjustments over time. For reliability, consider using the
 * Google Places API (costs ~$0.02/request).
 *
 * Alternative approach: Use Puppeteer/Playwright for full browser
 * rendering to handle dynamic content.
 */
async function scrapeReviews() {
  console.log(`🔍 Buscando reseñas de ${PLACE_NAME}...`);
  console.log(`📍 URL: ${MAPS_URL}`);

  // Try fetching the Google Maps page
  // Note: Google Maps requires JavaScript rendering, so a simple fetch
  // won't get the reviews. We need a headless browser approach.
  
  try {
    // Method 1: Try using the undocumented Google Maps data endpoint
    // This endpoint sometimes returns review data in a structured format
    const searchUrl = `https://www.google.com/maps/place/3DRioja/@42.4654023,-2.4527288,17z`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    
    const html = await response.text();
    
    // Try to extract review data from the page source
    // Google embeds some data in script tags as JSON-like structures
    const reviews = extractReviewsFromHTML(html);
    
    if (reviews.length > 0) {
      updateTestimonials(reviews);
      console.log(`✅ ${reviews.length} reseñas encontradas y guardadas.`);
    } else {
      console.log('⚠️  No se pudieron extraer reseñas del HTML.');
      console.log('');
      console.log('Opciones:');
      console.log('  1. Ejecuta manualmente: abre Google Maps, copia las reseñas');
      console.log('     y edita server/data/testimonials.json');
      console.log('  2. Instala Playwright para scraping con navegador headless:');
      console.log('     npm install -D playwright');
      console.log('     y descomenta el método scrapeWithPlaywright() abajo');
      console.log('');
      console.log('📋 Formato del JSON:');
      console.log(JSON.stringify({
        testimonials: [{
          id: 'gm-review-nombre-apellido',
          author: 'Nombre Apellido',
          text: 'Texto de la reseña...',
          rating: 5,
          date: '2025-08-01',
          source: 'Google Maps'
        }]
      }, null, 2));
    }
  } catch (error) {
    console.error('❌ Error al obtener reseñas:', error.message);
    console.log('');
    console.log('Para actualizar manualmente, edita:');
    console.log(`  ${TESTIMONIALS_PATH}`);
  }
}

/**
 * Try to extract reviews from Google Maps HTML source.
 * This is fragile and may break when Google changes their page structure.
 */
function extractReviewsFromHTML(html) {
  const reviews = [];
  
  // Google sometimes embeds review data in window.__NEXT_DATA__ or similar
  // Look for patterns like review text near star ratings
  
  // Pattern 1: Look for structured review data in script tags
  const dataMatches = html.match(/\["([^"]{10,200})"\s*,\s*(\d)\s*,/g);
  
  if (dataMatches) {
    for (const match of dataMatches) {
      const textMatch = match.match(/\["([^"]+)"/);
      const ratingMatch = match.match(/,\s*(\d)\s*,/);
      if (textMatch && ratingMatch) {
        const rating = parseInt(ratingMatch[1]);
        if (rating >= 1 && rating <= 5) {
          reviews.push({
            text: textMatch[1],
            rating,
          });
        }
      }
    }
  }
  
  return reviews;
}

/**
 * Update testimonials.json with scraped reviews
 */
function updateTestimonials(reviews) {
  // Read existing data to preserve any manual entries
  let existing = { testimonials: [] };
  try {
    existing = JSON.parse(readFileSync(TESTIMONIALS_PATH, 'utf-8'));
  } catch {
    // File doesn't exist or is invalid, start fresh
  }

  const now = new Date().toISOString().split('T')[0];
  
  const newTestimonials = reviews.map((review, i) => ({
    id: `gm-scraped-${now}-${i}`,
    author: review.author || `Reseña ${i + 1}`,
    text: review.text,
    rating: review.rating,
    date: review.date || now,
    source: 'Google Maps',
  }));

  const data = {
    testimonials: newTestimonials,
  };

  writeFileSync(TESTIMONIALS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`📁 Archivo actualizado: ${TESTIMONIALS_PATH}`);
}

/*
 * UNCOMMENT THIS METHOD if you install Playwright:
 *   npm install -D playwright
 *
 * This uses a real browser to render Google Maps and extract reviews.
 * Much more reliable than HTML parsing.

async function scrapeWithPlaywright() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://maps.app.goo.gl/K9djyHA7WikZcRP7A', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  
  // Wait for reviews to load
  await page.waitForSelector('[data-review-id]', { timeout: 10000 }).catch(() => {});
  
  // Click "More reviews" button if present
  const moreButton = page.locator('button:has-text("reseñas")');
  if (await moreButton.isVisible()) {
    await moreButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Extract review data
  const reviews = await page.evaluate(() => {
    const reviewElements = document.querySelectorAll('[data-review-id]');
    return Array.from(reviewElements).map(el => {
      const authorEl = el.querySelector('.d4r55');
      const textEl = el.querySelector('.wiI7pd');
      const starsEl = el.querySelector('[role="img"]');
      const dateEl = el.querySelector('.rsqaWe');
      
      const starsLabel = starsEl?.getAttribute('aria-label') || '';
      const ratingMatch = starsLabel.match(/(\d)/);
      
      return {
        author: authorEl?.textContent?.trim() || 'Anónimo',
        text: textEl?.textContent?.trim() || '',
        rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
        date: dateEl?.textContent?.trim() || '',
      };
    }).filter(r => r.text.length > 0);
  });
  
  await browser.close();
  return reviews;
}

*/

// Run the scraper
scrapeReviews();
