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
        body: JSON.stringify(data)
    });

    return await response.json();
}