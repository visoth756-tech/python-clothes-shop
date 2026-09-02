const API_BASE = "http://localhost:8080/api/payments";

export async function getPayments() {
  try {
    const response = await fetch(API_BASE);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to load payments");
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading payments:", error);
    return [];
  }
}
