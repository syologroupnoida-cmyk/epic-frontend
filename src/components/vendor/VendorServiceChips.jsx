export default function VendorServiceChips({ services = [] }) {
  if (!services.length) return null;
  return <ul className="vd-service-chips" aria-label="Services offered">{services.map((service) => <li key={service}>{service}</li>)}</ul>;
}
