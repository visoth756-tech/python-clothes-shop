document.addEventListener("DOMContentLoaded", function () {
    const autofillBtn = document.getElementById("btnAutofillCheckout");
    if (autofillBtn) {
        autofillBtn.addEventListener("click", function () {
            const nameInput = document.getElementById("name");
            const emailInput = document.getElementById("email");
            const addressInput = document.getElementById("address");
            const cityInput = document.getElementById("city");
            const zipInput = document.getElementById("zip");

            if (nameInput) nameInput.value = "John Doe";
            if (emailInput) emailInput.value = "john.doe@example.com";
            if (addressInput) addressInput.value = "742 Evergreen Terrace";
            if (cityInput) cityInput.value = "Springfield";
            if (zipInput) zipInput.value = "97477";

            if (typeof showToast === "function") {
                showToast("Checkout details auto-filled!", "success");
            }
        });
    }
});
