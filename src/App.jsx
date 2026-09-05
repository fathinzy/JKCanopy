import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Gallery from './components/Gallery.jsx'
import Layouts from './components/Layouts.jsx'
import Calculator from './components/Calculator.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Gallery />
        <Layouts />
        <Calculator />
      </main>
      <Footer />
    </div>
  )
}
