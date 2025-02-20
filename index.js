import {URL} from 'node:url';
import VALID_TLDS from './tlds.js';

/**
 * A list of common website domains.  Could be expanded or loaded from a file/database.
 * @type {Set<string>}
 */
const COMMON_SITES = new Set(['google.com', 'facebook.com', 'twitter.com', 'youtube.com', 'instagram.com', 'linkedin.com', 'wikipedia.org', 'amazon.com']);

/**
 * Fuzzy URL parser with enhanced fixes and security checks.
 *
 * @param {string} input - The user-entered URL string.
 * @returns {string} - A validated and corrected URL.
 * @throws {Error} If the URL is invalid after corrections.
 */
const parseUrl = input => {
  if (!input) {
    throw new Error('Input URL cannot be empty.');
  }

  let url = input.trim().toLowerCase();

  // Fix common protocol typos.
  url = url.replace(/^htp:\/\//, 'http://').replace(/^htps:\/\//, 'https://');

  // Fix common domain typos.
  url = url.replace(/\.(cmo|con|cm)$/, '.com');

  // Remove trailing punctuation.
  url = url.replace(/[.,;!?]+$/, '');

  // Replace underscores with hyphens in domains.
  url = url.replaceAll(/_+/g, '-');

  // Add protocol if missing (default to https).
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Add '.com' if no TLD is provided AND it looks like a domain.
  if (/^(https?:\/\/[a-z0-9-]+)(\/|$)/.test(url)) {
    url += '.com';
  }

  // Add 'www.' if it's a common site and missing.
  const domainMatch = url.match(/^(https?:\/\/)([a-z0-9-]+\.[a-z]{2,})(\/|$)/);
  if (domainMatch) {
    const [, , domain] = domainMatch;
    if (!domain.startsWith('www.') && COMMON_SITES.has(domain)) {
      url = url.replace(domain, `www.${domain}`);
    }
  }

  // Validate TLD.  This happens *before* the URL constructor
  // to give more specific error messages.
  const tld = url.split('.').pop().split('/')[0]; // Extract TLD safely.
  const testTLD = tld.toUpperCase();
  if (!VALID_TLDS.has(testTLD)) {
    throw new Error(`Invalid TLD "${tld}" in URL: ${input}`);
  }

  // Final URL validation and encoding using the URL constructor.
  try {
    const validUrl = new URL(url);
    return validUrl.href; // Use .href for a fully encoded URL.
  } catch (error) {
    throw new Error(`Invalid URL after corrections "${url}": ${error.message}`);
  }
};

export default parseUrl;
