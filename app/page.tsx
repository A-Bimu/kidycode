export default function HomeFallback() {
  return (
    <main className="fallback-page">
      <h1>KidyCode</h1>
      <p>Learn HTML, CSS and JavaScript by building a complete website.</p>
      <nav aria-label="KidyCode experiences">
        <a href="/learn">Ages 10 to 12</a>
        <a href="/learn/13-15">Ages 13 to 15</a>
        <a href="/learn/16-18">Ages 16 to 18</a>
        <a href="/learn/adults">Adults</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/catalogue">Course catalogue</a>
        <a href="/notes">Notes Library</a>
        <a href="/practice">Practice Lab</a>
        <a href="/design">UI and UX Design</a>
        <a href="/build-outside">Build Outside</a>
        <a href="/curriculum">Curriculum and evidence</a>
        <a href="/institution">Pilot workspace</a>
      </nav>
    </main>
  );
}
