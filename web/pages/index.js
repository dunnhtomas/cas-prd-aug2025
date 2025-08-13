import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>CAS Tracker PRD</title>
        <meta name="description" content="CAS Tracker monitoring and SEO test sandbox" />
        <link rel="canonical" href="http://localhost:3000/" />
      </Head>
      <main style={{fontFamily:'sans-serif', padding:'2rem'}}>
        <h1>CAS Tracker PRD</h1>
        <p>Frontend running. Tracker API expected at <code>http://localhost:8080/health</code>.</p>
      </main>
    </>
  );
}
