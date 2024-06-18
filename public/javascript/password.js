// Function for toggling the visibility of the passed element to visible state

function togglePassword(inputId) {
  var passwordInput = document.getElementById(inputId);
  var passwordIcon = document.getElementById(inputId + "-icon");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    passwordIcon.classList.remove("ri-eye-line");
    passwordIcon.classList.add("ri-eye-close-line");
  } else {
    passwordInput.type = "password";
    passwordIcon.classList.remove("ri-eye-close-line");
    passwordIcon.classList.add("ri-eye-line");
  }
}

document.getElementById("password").addEventListener("click", togglePassword());
