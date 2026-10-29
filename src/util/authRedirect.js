export function normalizeRole(role = "") {
  return String(role).trim().toUpperCase();
}

export function normalizeKycStatus(status = "") {
  return String(status).trim().toUpperCase();
}

export function isApprovedKycStatus(status) {
  const normalizedStatus = normalizeKycStatus(status);
  return normalizedStatus === "APPROVED" || normalizedStatus === "APPROVEL";
}

export function getPostLoginAction(user = {}) {
  const role = normalizeRole(user.role);

  if (role === "VENDOR" || role === "AGENT") {
    const kycStatus = normalizeKycStatus(user.vendorProfile?.kycStatus);
    const nextStep = String(user.vendorProfile?.nextStep || "").trim().toUpperCase();

    if (kycStatus === "AWAITING") {
      return {
        type: "pending-approval",
        role: "VENDOR",
      };
    }

    if (nextStep === "RESUBMIT_KYC" || kycStatus === "REJECTED") {
      return {
        type: "redirect",
        role: "VENDOR",
        route: "/kyc",
      };
    }

    if (kycStatus === "PENDING" || nextStep === "COMPLETE_KYC" || !isApprovedKycStatus(kycStatus)) {
      return {
        type: "redirect",
        role: "VENDOR",
        route: "/kyc",
      };
    }

    return {
      type: "redirect",
      role: "VENDOR",
      route: "/partner/dashboard",
    };
  }

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return {
      type: "redirect",
      role,
      route: "/superadmin/dashboard",
    };
  }

  return {
    type: "redirect",
    role: "CLIENT",
    route: "/user/dashboard",
  };
}
