export const socialLinks = [
  { label: 'Facebook', iconClass: 'footer-facebook-icon', href: 'https://www.facebook.com/EpicWeddingportal' },
  { label: 'Instagram', iconClass: 'footer-instagram-icon', href: '#' },
  { label: 'LinkedIn', iconClass: 'footer-linkedin-icon', href: 'https://www.linkedin.com/company/epic-a-wedding-portal/' },
];

export default function SocialLinks({ className = '' }) {
  return <div className={className} aria-label="Social media">{socialLinks.map((social) => <a key={social.label} href={social.href} aria-label={social.label} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current hover:bg-white/20" {...(social.href !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><span className={social.iconClass} aria-hidden="true" /></a>)}</div>;
}
