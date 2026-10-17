import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import mandap from "@/images/hero-mandap.png";
import coupleJaipur from "@/images/story-jaipur.png";
import coupleGoa from "@/images/story-goa.png";
import coupleAhmedabad from "@/images/story-ahmedabad.png";

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const bookings = [34, 57, 49, 42, 54, 56];
const revenue = [10.8, 17.1, 15.3, 12.1, 17.5, 15.9];
const activities = [
  ["people", "New couple registered", "Rahul & Priya", "10 mins ago", "pink"],
  ["calendar", "Booking confirmed", "Royal Palace, Jaipur", "1 hour ago", "gold"],
  ["wallet", "Payment received", "₹1,25,000 from Amit & Neha", "3 hours ago", "mint"],
  ["store", "Vendor added", "Dream Moments Photography", "5 hours ago", "purple"],
  ["heart", "Wedding completed", "Sneha & Karan", "8 hours ago", "peach"],
  ["calendar", "Event schedule updated", "Mehendi celebration", "Yesterday", "pink"],
];
const weddings = [
  ["18", "OCT", "Rahul & Priya", "Royal Palace, Jaipur", "In 2 days", coupleJaipur],
  ["22", "OCT", "Amit & Neha", "The Leela, Udaipur", "In 6 days", coupleAhmedabad],
  ["28", "OCT", "Karan & Sneha", "Taj Resort, Goa", "In 12 days", coupleGoa],
  ["05", "NOV", "Vikram & Aditi", "ITC Grand Bharat", "In 20 days", coupleJaipur],
  ["12", "NOV", "Rohan & Meera", "JW Marriott, Delhi", "In 27 days", coupleAhmedabad],
  ["20", "NOV", "Arjun & Riya", "Fairmont, Jaipur", "In 35 days", coupleJaipur],
];
const paths = {
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 10h2m4 0h2m-8 4h2m4 0h2",
  wallet: "M3 7h17v14H3V7Zm0 0V4h15v3m-4 6h7v4h-7v-4Z",
  store: "M3 10V7l2-4h14l2 4v3M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 13v8h14v-8M9 21v-6h6v6",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  chart: "M4 21V10h4v11m2 0V3h4v18m2 0v-7h4v7M2 21h20",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  check: "m5 12 4 4L19 6",
};
export function PortalIcon({ name, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.calendar} /></svg>;
}
function PanelTitle({ icon, title, children }) {
  return <div className="wp-panel-title"><h2><span className="wp-title-icon"><PortalIcon name={icon} /></span>{title}</h2>{children}</div>;
}
function Sparkline({ tone, id }) {
  return <svg className={`wp-sparkline wp-tone-${tone}`} viewBox="0 0 140 48" aria-hidden="true"><defs><linearGradient id={`wp-spark-${id}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".25" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d="M1 43C15 43 20 20 31 27S45 40 55 26 69 18 78 25 91 30 99 14 111 41 121 20 133 8 139 4V48H1Z" fill={`url(#wp-spark-${id})`} /><path d="M1 43C15 43 20 20 31 27S45 40 55 26 69 18 78 25 91 30 99 14 111 41 121 20 133 8 139 4" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function subscribeClock(callback) {
  const timer = setInterval(callback, 60000);
  return () => clearInterval(timer);
}
function clockSnapshot() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  return hour < 12 ? "Good Morning," : hour < 17 ? "Good Afternoon," : "Good Evening,";
}

export default function WeddingAdminOverview({ onNavigate }) {
  const clock = useSyncExternalStore(subscribeClock, clockSnapshot, () => "");
  const greeting = clock || "Welcome back,";
  const [period, setPeriod] = useState("6");
  const [chartType, setChartType] = useState("both");
  const [allActivities, setAllActivities] = useState(false);
  const [allWeddings, setAllWeddings] = useState(false);
  const [statusDetails, setStatusDetails] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [allTasks, setAllTasks] = useState(false);
  const stats = [
    { label: "Total Couples", value: "328", change: "12%", icon: "people", tone: "pink" },
    { label: "Upcoming Weddings", value: "56", change: "18%", icon: "calendar", tone: "purple" },
    { label: "Total Revenue", value: "₹ 24.8L", change: "32%", icon: "wallet", tone: "gold" },
    { label: "Total Guests", value: "1,420", change: "20%", icon: "people", tone: "mint" },
  ];
  const start = period === "3" ? 3 : 0;
  const chartMonths = months.slice(start);
  const chartBookings = bookings.slice(start);
  const chartRevenue = revenue.slice(start);
  const x = (index) => 58 + index * (510 / (chartMonths.length - 1));
  const tasks = [["Follow up with Sharma family", "11:00 AM"], ["Confirm venue booking", "02:00 PM"], ["Review invitation design", "04:00 PM"], ["Prepare vendor shortlist", "05:00 PM"]];
  return <div className="wp-overview">
    <section className="wp-welcome"><Image src={mandap} alt="Floral mandap at an Indian wedding" fill priority sizes="(max-width: 900px) 100vw, 80vw" /><div className="wp-welcome-copy"><p>{greeting}</p><h1>Admin</h1><blockquote>“Behind every beautiful wedding,<br />there is a well-planned journey.”</blockquote></div><div className="wp-welcome-motto">Create<br /><span>Manage<br />Celebrate</span><br />Beautifully <span aria-hidden="true">♡</span></div></section>
    <div className="wp-overview-label"><span>YOUR CELEBRATIONS AT A GLANCE</span><small>Sample overview data</small></div>
    <section className="wp-stats" aria-label="Dashboard metrics">{stats.map((stat, index) => <article className="wp-panel wp-stat" key={stat.label}><div className="wp-stat-top"><span className={`wp-stat-icon wp-tone-${stat.tone}`}><PortalIcon name={stat.icon} /></span><div><strong>{stat.value}</strong><p>{stat.label}</p></div></div><div className="wp-stat-bottom"><p><b>↑ {stat.change}</b><span>vs last month</span></p><Sparkline tone={stat.tone} id={index} /></div></article>)}</section>
    <div className="wp-chart-row"><section className="wp-panel wp-bookings"><PanelTitle icon="calendar" title="Wedding Bookings"><div className="wp-chart-controls"><label><span className="sr-only">Chart period</span><select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></select></label><label><span className="sr-only">Chart values</span><select value={chartType} onChange={(e) => setChartType(e.target.value)}><option value="both">Bookings & revenue</option><option value="bookings">Bookings</option><option value="revenue">Revenue</option></select></label></div></PanelTitle><p className="wp-panel-subtitle">Monthly bookings and revenue overview</p>
      <svg className="wp-booking-chart" viewBox="0 0 640 210" role="img" aria-label={`Sample monthly ${chartType === "both" ? "bookings and revenue" : chartType}, ${chartMonths[0]} to September 2026`}><defs><linearGradient id="wp-booking-bars" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff9dbb" /><stop offset="1" stopColor="#c46987" /></linearGradient></defs>{[0, 20, 40, 60, 80].map((tick) => <g key={tick}><line x1="30" y1={172 - tick * 1.85} x2="600" y2={172 - tick * 1.85} stroke="#eee4df" /><text x="22" y={176 - tick * 1.85} textAnchor="end">{tick}</text><text x="608" y={176 - tick * 1.85}>{tick / 4}{tick ? "L" : ""}</text></g>)}{chartMonths.map((month, index) => <g key={month}>{chartType !== "revenue" && <rect x={x(index) - 17} y={172 - chartBookings[index] * 1.85} width="34" height={chartBookings[index] * 1.85} rx="5" fill="url(#wp-booking-bars)"><title>{`${month}: ${chartBookings[index]} bookings`}</title></rect>}<text x={x(index)} y="191" textAnchor="middle">{month}</text></g>)}{chartType !== "bookings" && <><polyline points={chartRevenue.map((value, index) => `${x(index)},${172 - value * 7.4}`).join(" ")} fill="none" stroke="#d58a20" strokeWidth="1.8" />{chartRevenue.map((value, index) => <circle key={index} cx={x(index)} cy={172 - value * 7.4} r="4.7" fill="#e7a331" stroke="#fff"><title>{`${chartMonths[index]}: ₹${value} lakh revenue`}</title></circle>)}</>}</svg><div className="wp-chart-legend">{chartType !== "revenue" && <span><i className="wp-dot wp-dot-pink" /> Bookings</span>}{chartType !== "bookings" && <span><i className="wp-dot wp-dot-gold" /> Revenue (₹)</span>}</div>
    </section><section className="wp-panel wp-status"><PanelTitle icon="heart" title="Wedding Status"><button type="button" className="wp-view-all" onClick={() => setStatusDetails(!statusDetails)}>{statusDetails ? "Show less" : "View All"}</button></PanelTitle><div className="wp-status-body"><div className="wp-donut" role="img" aria-label="56 weddings: 18 completed, 12 ongoing, 20 upcoming, 6 cancelled"><div><strong>56</strong><span>Weddings</span></div></div><ul>{[["Completed", "18", "32%", "mint"], ["Ongoing", "12", "21%", "gold"], ["Upcoming", "20", "36%", "pink"], ["Cancelled", "6", "11%", "stone"]].map(([label, count, percent, tone]) => <li key={label}><span><i className={`wp-dot wp-dot-${tone}`} />{label}</span><strong>{count} <small>({percent})</small></strong></li>)}</ul></div>{statusDetails && <p className="wp-status-note">Sample wedding breakdown. Select Vendor Management in the sidebar to review real vendor records.</p>}</section></div>
    <div className="wp-bottom-row"><section className="wp-panel wp-activity"><PanelTitle icon="people" title="Recent Activities"><button type="button" className="wp-view-all" onClick={() => setAllActivities(!allActivities)}>{allActivities ? "Show less" : "View All"}</button></PanelTitle><ul>{activities.slice(0, allActivities ? activities.length : 5).map(([icon, title, description, time, tone]) => <li key={title}><span className={`wp-activity-icon wp-tone-${tone}`}><PortalIcon name={icon} /></span><div><strong>{title}</strong><p>{description}</p></div><time>{time}</time></li>)}</ul></section>
      <section className="wp-panel wp-weddings"><PanelTitle icon="calendar" title="Upcoming Weddings"><button type="button" className="wp-view-all" onClick={() => setAllWeddings(!allWeddings)}>{allWeddings ? "Show less" : "View All"}</button></PanelTitle><ul>{weddings.slice(0, allWeddings ? weddings.length : 5).map(([day, month, names, venue, relative, photo]) => <li key={names}><div className="wp-wedding-date"><small>{month}</small><strong>{day}</strong></div><Image src={photo} alt={names} width={42} height={42} /><div className="wp-wedding-info"><strong>{names}</strong><p>{venue}</p></div><span className="wp-days">{relative}</span></li>)}</ul></section>
      <div className="wp-action-column"><section className="wp-panel wp-quick-actions"><PanelTitle icon="store" title="Quick Actions" /><div className="wp-action-grid">{[["people", "Review Vendors", "Vendor Kyc List", "pink"], ["calendar", "Add City", "Add City", "purple"], ["store", "Add Service", "Add Services", "gold"], ["chart", "Services List", "Services List", "mint"], ["wallet", "Categories", "Add Service Category", "blue"]].map(([icon, label, panel, tone]) => <button type="button" key={label} className={`wp-tone-${tone}`} onClick={() => onNavigate(panel)}><PortalIcon name={icon} /><span>{label}</span></button>)}<a className="wp-tone-pink" href="/" target="_blank" rel="noopener noreferrer"><PortalIcon name="globe" /><span>View Website</span></a></div></section><section className="wp-panel wp-tasks"><PanelTitle icon="calendar" title="Today’s Tasks"><button type="button" className="wp-view-all" onClick={() => setAllTasks(!allTasks)}>{allTasks ? "Show less" : "View All"}</button></PanelTitle>{tasks.slice(0, allTasks ? 4 : 3).map(([task, time]) => <label key={task} className={completed.includes(task) ? "is-complete" : ""}><input type="checkbox" checked={completed.includes(task)} onChange={(event) => setCompleted((current) => event.target.checked ? [...current, task] : current.filter((value) => value !== task))} /><span>{task}</span><time>{time}</time></label>)}</section></div>
    </div>
  </div>;
}
