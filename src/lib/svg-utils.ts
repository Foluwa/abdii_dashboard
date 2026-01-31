/**
 * Utility functions for handling SVG avatars
 * Cleans and properly encodes SVG data for display
 */

/**
 * Decodes HTML entities in a string
 * Converts &lt; to <, &gt; to >, &amp; to &, etc.
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') return text;
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Cleans and encodes SVG data for use in img src attribute
 * Handles both raw SVG strings and already encoded data URLs
 */
export function cleanSvgForDisplay(svgData: string | null | undefined): string | null {
  if (!svgData) return null;
  
  // If it's already a valid http/https URL, return as is
  if (svgData.startsWith('http://') || svgData.startsWith('https://')) {
    return svgData;
  }
  
  // If it's already a properly formatted data URL, return as is
  if (svgData.startsWith('data:image/svg+xml;base64,')) {
    return svgData;
  }
  
  // If it starts with data:image/svg+xml but has URL encoding or UTF-8 encoding
  if (svgData.startsWith('data:image/svg+xml')) {
    return svgData;
  }
  
  // If it looks like escaped HTML (contains &lt; or &gt;), decode it first
  let cleanedSvg = svgData;
  if (svgData.includes('&lt;') || svgData.includes('&gt;') || svgData.includes('&quot;')) {
    cleanedSvg = decodeHtmlEntities(svgData);
  }
  
  // If it's raw SVG (starts with <svg), encode it properly
  if (cleanedSvg.trim().startsWith('<svg') || cleanedSvg.trim().startsWith('<?xml')) {
    // Remove any XML declaration
    cleanedSvg = cleanedSvg.replace(/<\?xml[^?]*\?>/g, '');
    
    // Encode for data URL
    // Use UTF-8 encoding with URL encoding for better compatibility
    const encoded = encodeURIComponent(cleanedSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }
  
  // If nothing matches, return the original (might be a blob URL or other format)
  return svgData;
}

/**
 * Checks if a URL/data is a valid avatar source
 */
export function isValidAvatarSource(src: string | null | undefined): boolean {
  if (!src) return false;
  
  // Valid URL
  if (src.startsWith('http://') || src.startsWith('https://')) return true;
  
  // Valid data URL
  if (src.startsWith('data:image/')) return true;
  
  // Valid blob URL
  if (src.startsWith('blob:')) return true;
  
  // Raw SVG (will be converted)
  if (src.trim().startsWith('<svg')) return true;
  
  // Escaped SVG (will be converted)
  if (src.includes('&lt;svg')) return true;
  
  return false;
}

/**
 * Generate initials from a name for avatar fallback
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a color for avatar background based on user ID or name
 */
export function getAvatarColor(identifier: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
