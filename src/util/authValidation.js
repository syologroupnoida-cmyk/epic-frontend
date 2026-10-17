const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;

export function validateRegistrationForm(form) {
  const errors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!firstName) {
    errors.firstName = "First name is required";
  } else if (firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }

  if (!lastName) {
    errors.lastName = "Last name is required";
  } else if (lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!emailPattern.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (!phonePattern.test(phone)) {
    errors.phone = "Enter a valid 10 digit Indian phone number";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = "Password needs one uppercase letter";
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = "Password needs one lowercase letter";
  } else if (!/\d/.test(form.password)) {
    errors.password = "Password needs one number";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function toRegisterPayload(form, role) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    password: form.password,
    role,
  };
}
