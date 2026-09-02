const API_BASE = "http://localhost:8080/api/orders";

export async function getOrders() {
  try {
    const response = await fetch(API_BASE);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to load orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
}
