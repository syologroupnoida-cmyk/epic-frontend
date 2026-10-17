import Image from "next/image";
import { useState } from "react";

export default function VendorImage({ vendor, category, ...props }) {
  const [failed, setFailed] = useState(false);
  const placeholder = !vendor.hasImage || failed;
  const src = placeholder ? "/images/vendor-placeholder.svg" : vendor.image;
  return <Image {...props} src={src} alt={placeholder ? "Business storefront illustration" : vendor.name} unoptimized={typeof src === "string" && /^https?:/.test(src)} onError={placeholder ? undefined : () => setFailed(true)} />;
}
