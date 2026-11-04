/* Cart API helpers.
 *
 * Moved from the old home core api module. It has an `export`, so it can only
 * be loaded as a module — consumers must `import { post } from "./api.js"`.
 * window.post is still assigned so any classic consumer keeps working.
 */

async function post(url, data) {
    const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
    )?.content;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Request failed");

    return response.json();
}

window.post = post;

export { post };
