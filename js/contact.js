
const contactForm = document.getElementById("contact-form");

const nameInput = document.getElementById("contact-name");
const emailInput = document.getElementById("contact-email");
const phoneInput = document.getElementById("contact-phone");
const messageInput = document.getElementById("contact-message");

const submitButton = document.getElementById("contact-submit");
const formStatus = document.getElementById("form-status");

const fields = [
    {
        input: nameInput,
        error: document.getElementById("name-error")
    },
    {
        input: emailInput,
        error: document.getElementById("email-error")
    },
    {
        input: phoneInput,
        error: document.getElementById("phone-error")
    },
    {
        input: messageInput,
        error: document.getElementById("message-error")
    }
];

// Validate all form fields.
function validateForm() {
    let isValid = true;

    // Clear previous errors.
    fields.forEach(function (field) {
        field.error.textContent = "";
        field.input.classList.remove("invalid-field");
        field.input.removeAttribute("aria-invalid");
    });

    formStatus.textContent = "";
    formStatus.className = "form-status";

    function showError(input, errorElement, message) {
        errorElement.textContent = message;
        input.classList.add("invalid-field");
        input.setAttribute("aria-invalid", "true");
        isValid = false;
    }

    // Name validation.
    if (!nameInput.value.trim()) {
        showError(
            nameInput,
            document.getElementById("name-error"),
            "Please enter your name."
        );
    }

    // Email validation.
    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        showError(
            emailInput,
            document.getElementById("email-error"),
            "Please enter your email address."
        );
    } else if (!emailPattern.test(email)) {
        showError(
            emailInput,
            document.getElementById("email-error"),
            "Please enter a valid email address."
        );
    }

    // Phone validation: digits only.
    const phone = phoneInput.value.trim();

    if (!phone) {
        showError(
            phoneInput,
            document.getElementById("phone-error"),
            "Please enter your phone number."
        );
    } else if (!/^\d+$/.test(phone)) {
        showError(
            phoneInput,
            document.getElementById("phone-error"),
            "Use digits only. Do not include spaces, +, or hyphens."
        );
    }

    // Message validation.
    if (!messageInput.value.trim()) {
        showError(
            messageInput,
            document.getElementById("message-error"),
            "Please enter a message."
        );
    }

    return isValid;
}

// Clear a field's error when the visitor edits it.
fields.forEach(function (field) {
    field.input.addEventListener("input", function () {
        field.error.textContent = "";
        field.input.classList.remove("invalid-field");
        field.input.removeAttribute("aria-invalid");
    });
});

// Validate the form when submitted.
contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
        const firstInvalidField = fields.find(function (field) {
            return field.input.classList.contains("invalid-field");
        });

        if (firstInvalidField) {
            firstInvalidField.input.focus();
        }

        formStatus.textContent =
            "Please correct the errors above and try again.";
        formStatus.classList.add("error");

        return;
    }

    // Display success when all validation checks pass.
    formStatus.textContent =
        "Form validated successfully! All fields are correct.";

    formStatus.classList.add("success");

    // No email is sent and no data is stored.
});
