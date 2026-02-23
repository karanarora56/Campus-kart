function App() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full">
      {/* Removed 'text-white' so it follows the theme's text-main */}
      <h1 className="text-6xl font-extrabold mb-4 tracking-tighter">
        Campus <span className="text-midnight-accent">Kart</span>
      </h1>
      <p className="opacity-60 mb-8 max-w-md font-medium">
        The Midnight Social Marketplace for NITJ Students.
      </p>
      <button className="bg-midnight-accent hover:scale-105 active:scale-95 text-white px-10 py-4 rounded-full font-bold transition-all shadow-xl shadow-midnight-accent/20">
        Start Exploring
      </button>
    </div>
  )
}

export default App