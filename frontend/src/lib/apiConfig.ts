// Backend API configuration
// Set to your Render backend URL after deployment
const getBackendUrl = (): string => {
  // @ts-ignore - Vite env var
  return import.meta.env?.VITE_BACKEND_URL || 'http://localhost:10000';
};

export const BACKEND_URL = getBackendUrl();

// Helper function to call backend API
export async function callBackend(endpoint: string, formData: FormData): Promise<Blob> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backend error: ${error}`);
  }
  
  return await response.blob();
}
