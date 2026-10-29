import Image from 'next/image';
import Link from 'next/link';
import styles from './ContentPages.module.css';

export default function CompactPageBanner({ title, label = title, image, id, rounded = false }) {
  return <section id={id} className={`${styles.banner} ${rounded ? styles.roundedBanner : ''}`}>
    {image && <Image src={image} alt="" fill priority sizes="100vw" className={styles.bannerImage} />}
    <div className={styles.bannerInner}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{label}</span></nav>
      <h1>{title}</h1>
    </div>
  </section>;
}
