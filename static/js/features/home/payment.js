document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("card_number")?.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    });

    document.getElementById("expiry")?.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);
    });

    document.getElementById("cvv")?.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 3);
    });

    const autofillBtn = document.getElementById("btnAutofillPayment");
    if (autofillBtn) {
        autofillBtn.addEventListener("click", function () {
            const cardName = document.getElementById("card_name");
            const cardNumber = document.getElementById("card_number");
            const expiry = document.getElementById("expiry");
            const cvv = document.getElementById("cvv");

            if (cardName && !cardName.value) cardName.value = "John Doe";
            if (cardNumber) cardNumber.value = "4242 4242 4242 4242";
            if (expiry) expiry.value = "12/28";
            if (cvv) cvv.value = "888";

            if (typeof showToast === "function") {
                showToast("Payment details auto-filled!", "success");
            }
        });
    }
});
