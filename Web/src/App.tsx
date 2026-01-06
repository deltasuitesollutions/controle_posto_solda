import { Routes, Route } from "react-router-dom";
import Postos from "./Pages/Postos";
import LeitorRfid from "./Pages/Leitor";
import Funcionarios from "./Pages/Funcionarios";
import Modelos from "./Pages/Modelos";
import Registros from "./Pages/Registros";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Postos />} />
      <Route path="/leitor" element={<LeitorRfid />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/modelos" element={<Modelos />} />
      <Route path="/registros" element={<Registros />} />
    </Routes>
  )
}

export default App
