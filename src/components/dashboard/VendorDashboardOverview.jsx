import Image from "next/image";
import { useState } from "react";
import { PortalIcon } from "@/components/dashboard/WeddingAdminOverview";
import hero from "@/images/hero-reception.png";
import wedding from "@/images/hero-mandap.png";
import coupleA from "@/images/story-jaipur.png";
import coupleB from "@/images/story-ahmedabad.png";
import coupleC from "@/images/story-goa.png";

const bookings = [
  { name: "Rahul & Priya", service: "Wedding", date: "18 Oct 2026", place: "Royal Palace, Jaipur", amount: 125000, status: "Confirmed", photo: coupleA },
  { name: "Amit & Neha", service: "Pre-Wedding", date: "22 Oct 2026", place: "Udaipur", amount: 65000, status: "Advance Paid", photo: coupleB },
  { name: "Karan & Sneha", service: "Wedding", date: "28 Oct 2026", place: "Taj Resort, Goa", amount: 175000, status: "Confirmed", photo: coupleC },
  { name: "Vikram & Aditi", service: "Reception", date: "05 Nov 2026", place: "ITC Grand Bharat", amount: 90000, status: "Pending", photo: coupleA },
  { name: "Rohan & Meera", service: "Pre-Wedding", date: "12 Nov 2026", place: "JW Marriott, Delhi", amount: 70000, status: "Confirmed", photo: coupleB },
];
const reviews = [
  { name: "Priya & Rahul", date: "12 Oct 2026", text: "Amazing experience! You captured our special day so beautifully. Highly recommended!", photo: coupleA },
  { name: "Neha & Amit", date: "10 Oct 2026", text: "A thoughtful team that made every little detail feel special. Thank you for the beautiful memories.", photo: coupleB },
  { name: "Sneha & Karan", date: "08 Oct 2026", text: "Professional, creative, and lovely to work with from the first conversation to the big day.", photo: coupleC },
];
const enquiries = [
  ["Rahul & Priya", "Wedding photography", "18 Oct 2026", "New Enquiry"],
  ["Amit & Neha", "Pre-wedding shoot", "22 Oct 2026", "Discussing"],
  ["Karan & Sneha", "Wedding coverage", "28 Oct 2026", "Proposal Sent"],
  ["Vikram & Aditi", "Reception", "05 Nov 2026", "Negotiation"],
];
const money = (value) => `₹${value.toLocaleString("en-IN")}`;

function Title({ children, action, onAction }) {
  return <div className="vp-panel-heading"><h2>{children}</h2>{action && <button type="button" className="wp-view-all" onClick={onAction}>{action}</button>}</div>;
}

function BookingsTable({ compact = false }) {
  return <div className="vp-table-scroll"><table className="vp-bookings-table"><caption className="sr-only">Sample vendor bookings</caption>{!compact && <thead><tr>{["Couple", "Event date", "Location", "Amount", "Status"].map((label) => <th key={label}>{label}</th>)}</tr></thead>}<tbody>{bookings.map((item) => <tr key={item.name}><td><div className="vp-couple"><Image src={item.photo} alt={item.name} width={38} height={38} /><div><strong>{item.name}</strong><span>{item.service}</span></div></div></td><td>{item.date}</td><td>{item.place}</td><td className="vp-amount">{money(item.amount)}</td><td><span className={`vp-status-badge ${item.status === "Confirmed" ? "vp-green" : item.status === "Pending" ? "vp-pink" : "vp-amber"}`}>{item.status}</span></td></tr>)}</tbody></table></div>;
}

function BookingChart() {
  const [period, setPeriod] = useState("6");
  const data = [{ month: "Apr", count: 15, revenue: 1 }, { month: "May", count: 22, revenue: 1.5 }, { month: "Jun", count: 18, revenue: 1.2 }, { month: "Jul", count: 23, revenue: 1.5 }, { month: "Aug", count: 25, revenue: 1.75 }, { month: "Sep", count: 27, revenue: 1.65 }].slice(period === "3" ? 3 : 0);
  const x = (index) => 66 + index * (490 / (data.length - 1));
  return <section className="wp-panel vp-chart"><div className="vp-panel-heading"><h2>Bookings Overview</h2><label><span className="sr-only">Booking chart period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></select></label></div><svg viewBox="0 0 640 210" className="vp-booking-chart" role="img" aria-label="Sample confirmed bookings and revenue"><defs><linearGradient id="vp-bookings-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffadc6" /><stop offset="1" stopColor="#e675a0" /></linearGradient></defs>{[0, 10, 20, 30, 40].map((tick) => <g key={tick}><line x1="28" x2="601" y1={172 - tick * 3.6} y2={172 - tick * 3.6} stroke="#eee7e6" /><text x="19" y={176 - tick * 3.6} textAnchor="end">{tick}</text><text x="610" y={176 - tick * 3.6}>{tick ? `${tick / 20}L` : "0"}</text></g>)}{data.map((item, index) => <g key={item.month}><rect x={x(index) - 18} y={172 - item.count * 3.6} width="36" height={item.count * 3.6} rx="4" fill="url(#vp-bookings-fill)"><title>{`${item.month}: ${item.count} confirmed bookings`}</title></rect><text x={x(index)} y="191" textAnchor="middle">{item.month}</text></g>)}<polyline points={data.map((item, index) => `${x(index)},${172 - item.revenue * 72}`).join(" ")} fill="none" stroke="#9e204f" strokeWidth="1.6" />{data.map((item, index) => <circle key={item.month} cx={x(index)} cy={172 - item.revenue * 72} r="4" fill="#b62e60" stroke="#fff"><title>{`${item.month}: ${money(item.revenue * 100000)} revenue`}</title></circle>)}</svg><div className="wp-chart-legend"><span><i className="wp-dot wp-dot-pink" /> Confirmed</span><span><i className="wp-dot vp-dot-wine" /> Revenue (₹)</span></div></section>;
}

function Schedule({ full = false }) {
  const [date, setDate] = useState("2026-10-16");
  function changeDay(direction) { const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + direction); setDate(next.toISOString().slice(0, 10)); }
  return <section className="wp-panel vp-schedule"><div className="vp-panel-heading"><h2>{full ? "Availability & Schedule" : "Today’s Schedule"}</h2><div className="vp-date-control"><button type="button" aria-label="Previous day" onClick={() => changeDay(-1)}>‹</button><input aria-label="Schedule date" type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} /><button type="button" aria-label="Next day" onClick={() => changeDay(1)}>›</button></div></div>{date === "2026-10-16" ? <ol className="vp-timeline">{[["09:00 AM", "Pre-Wedding Shoot", "Jal Mahal, Jaipur", "Ongoing", coupleA, "green"], ["01:00 PM", "Wedding Ceremony", "The Leela, Udaipur", "In 2 hrs", wedding, "pink"], ["05:00 PM", "Reception Event", "Rajasthan Palace, Jaipur", "Upcoming", hero, "purple"]].map(([time, title, venue, status, photo, tone]) => <li key={title}><time>{time}</time><span className={`vp-timeline-dot vp-${tone}`} /><Image src={photo} alt={title} width={58} height={45} /><div><strong>{title}</strong><p>{venue}</p></div><span className={`vp-status-badge vp-${tone}`}>{status}</span></li>)}</ol> : <div className="vp-schedule-empty"><PortalIcon name="calendar" /><p>No sample events scheduled for this date.</p></div>}</section>;
}

function Pipeline() {
  const [period, setPeriod] = useState("current");
  const counts = period === "current" ? [32, 24, 16, 10, 6] : [26, 19, 12, 7, 4];
  return <section className="wp-panel vp-pipeline"><div className="vp-panel-heading"><h2>Enquiry Pipeline</h2><label><span className="sr-only">Enquiry period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="current">This Month</option><option value="previous">Last Month</option></select></label></div><div className="vp-pipeline-content"><div className="vp-funnel" aria-hidden="true">{counts.map((count, index) => <div key={index} style={{ "--stage": index }}>{count}</div>)}</div><ul>{["New Enquiries", "Discussing", "Proposal Sent", "Negotiation", "Converted"].map((label, index) => <li key={label}><i style={{ background: ["#f76b9d", "#a354ee", "#ff9c16", "#3eac99", "#378ff4"][index] }} /><span>{label}</span><strong>{counts[index]} <small>({Math.round(counts[index] / counts[0] * 100)}%)</small></strong></li>)}</ul></div></section>;
}

function Reviews({ full = false }) {
  const [index, setIndex] = useState(0);
  const selected = full ? reviews : [reviews[index]];
  return <section className="wp-panel vp-reviews"><Title>Recent Reviews</Title>{selected.map((review) => <div key={review.name} className="vp-review-content">{!full && <button type="button" aria-label="Previous review" className="vp-review-arrow" onClick={() => setIndex((index + reviews.length - 1) % reviews.length)}>‹</button>}<Image src={review.photo} alt={review.name} width={74} height={72} /><div><div className="vp-review-meta"><strong>{review.name}</strong><span aria-label="5 out of 5 stars">★★★★★</span><time>{review.date}</time></div><p>“{review.text}”</p></div>{!full && <button type="button" aria-label="Next review" className="vp-review-arrow" onClick={() => setIndex((index + 1) % reviews.length)}>›</button>}</div>)}</section>;
}

function Earnings() {
  const [period, setPeriod] = useState("current");
  const values = period === "current" ? [75000, 40000, 25000] : [60000, 30000, 18000];
  return <section className="wp-panel vp-earnings"><div className="vp-panel-heading"><h2>Earnings Summary</h2><label><span className="sr-only">Earnings period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="current">This Month</option><option value="previous">Last Month</option></select></label></div><div className="vp-earnings-content"><div className="vp-earnings-donut" role="img" aria-label={`Sample earnings total ${money(values[0] + values[1])}`}><div><strong>{money(values[0] + values[1])}</strong><small>Total Earnings</small></div></div><ul>{["Advance Payments", "Final Payments", "Pending Payments"].map((label, index) => <li key={label}><i style={{ background: ["#43ad98", "#a056e9", "#ffa02b"][index] }} /><span>{label}</span><strong>{money(values[index])}</strong></li>)}</ul></div></section>;
}

function EnquiriesTable() {
  return <section className="wp-panel"><Title>Enquiries</Title><div className="vp-table-scroll"><table className="vp-bookings-table"><thead><tr>{["Couple", "Service", "Event Date", "Stage"].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{enquiries.map((item) => <tr key={item[0]}>{item.map((value) => <td key={value}>{value}</td>)}</tr>)}</tbody></table></div></section>;
}

export default function VendorDashboardOverview({ name = "Vendor", activePanel = "Overview", onNavigate }) {
  const stats = [["calendar", "24", "Total Bookings", "20%", "pink"], ["people", "32", "New Enquiries", "15%", "gold"], ["wallet", "₹ 4.8L", "Total Revenue", "28%", "purple"], ["star", "4.8", "Average Rating", "0.2", "mint"]];
  const quickActions = [["calendar", "View Availability", "Availability", "purple"], ["store", "Manage Services", "Update Profile", "gold"], ["globe", "View Gallery", "Gallery / Portfolio", "blue"], ["people", "View Enquiries", "Enquiries", "pink"], ["mail", "View Bookings", "Bookings", "purple"], ["wallet", "View Payments", "Payments", "pink"]];
  return <div className="wp-overview vp-overview">
    {activePanel === "Overview" && <section className="wp-welcome vp-welcome"><div className="vp-welcome-image"><Image src={hero} alt="Indian wedding couple at their celebration" fill priority sizes="100vw" /></div><div className="wp-welcome-copy"><p>Welcome back,</p><h1>{name}</h1><p className="vp-welcome-caption">Create the moments that last forever.</p></div><blockquote className="wp-welcome-motto">“Different<br />Love Stories.<br />Same Beautiful<br />Memories.”</blockquote></section>}
    {activePanel !== "Overview" && <div className="wp-overview-label"><span>{activePanel.toUpperCase()}</span><small>Sample reporting data</small></div>}
    {activePanel === "Overview" ? <>
      <section className="wp-stats">{stats.map(([icon, value, label, change, tone], index) => <article key={label} className="wp-panel wp-stat"><div className="wp-stat-top"><span className={`wp-stat-icon wp-tone-${tone}`}>{icon === "star" ? <span className="vp-stat-star" aria-hidden="true">★</span> : <PortalIcon name={icon} />}</span><div><strong>{value}</strong><p>{label}</p></div></div><div className="wp-stat-bottom"><p><b>↑ {change}</b><span>vs last month</span></p>{index !== 3 ? <div className={`vp-mini-bars vp-bars-${tone}`} aria-hidden="true">{[12, 23, 18, 31, 25, 32, 38, 44, 50].map((height, index) => <i key={index} style={{ height: `${height + (index % 2 ? 5 : 0)}%` }} />)}</div> : <svg className="vp-rating-trend" viewBox="0 0 120 45" aria-hidden="true"><path d="m1 40 12-13 11 7 13-11 13-9 11 12 12-13 12 5 13-10 10-5 10-2" fill="none" stroke="#19a278" strokeWidth="1.7" /></svg>}</div></article>)}</section>
      <div className="wp-overview-label"><span>YOUR BUSINESS AT A GLANCE</span><small>Sample reporting data</small></div>
      <div className="vp-top-grid"><BookingChart /><Schedule /></div>
      <div className="vp-middle-grid"><section className="wp-panel vp-recent-bookings"><Title action="View All" onAction={() => onNavigate("Bookings")}>Recent Bookings</Title><BookingsTable compact /></section><Pipeline /><section className="wp-panel vp-quick-actions"><Title>Quick Actions</Title><div className="wp-action-grid">{quickActions.map(([icon, label, panel, tone]) => <button type="button" key={label} className={`wp-tone-${tone}`} onClick={() => onNavigate(panel)}><PortalIcon name={icon} /><span>{label}</span></button>)}</div></section></div>
      <div className="vp-bottom-grid"><Reviews /><Earnings /><section className="vp-portfolio-banner"><Image src={hero} alt="Wedding portfolio inspiration" fill sizes="300px" /><div><h2>Create Memories.<br />Create Happiness.</h2><button type="button" onClick={() => onNavigate("Gallery / Portfolio")}>Explore Portfolio <span aria-hidden="true">→</span></button></div></section></div>
    </> : activePanel === "Bookings" ? <section className="wp-panel"><Title>Recent Bookings</Title><BookingsTable /></section>
      : activePanel === "Availability" ? <Schedule full />
      : activePanel === "Enquiries" ? <div className="vp-top-grid"><EnquiriesTable /><Pipeline /></div>
      : activePanel === "Reviews" ? <Reviews full />
      : activePanel === "Payments" ? <div className="vp-top-grid"><Earnings /><section className="wp-panel"><Title>Booking Payments</Title><BookingsTable /></section></div>
      : activePanel === "Gallery / Portfolio" ? <section className="wp-panel"><Title>Gallery / Portfolio</Title><p className="vp-gallery-note">Wedding inspiration · Sample portfolio images</p><div className="vp-gallery">{[coupleA, coupleB, coupleC, wedding, hero].map((photo, index) => <div key={index}><Image src={photo} alt={`Wedding inspiration ${index + 1}`} fill sizes="(max-width: 700px) 80vw, 25vw" /></div>)}</div></section>
      : <div className="vp-top-grid"><BookingChart /><Pipeline /></div>}
  </div>;
}
