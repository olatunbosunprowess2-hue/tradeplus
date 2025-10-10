export default function Home() {
  return (
    <main style={styles.main}>
      <h1>TradePlus Web App</h1>
      <p>Welcome to the TradePlus marketplace!</p>
    </main>
  );
}

const styles = {
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
  }
}

