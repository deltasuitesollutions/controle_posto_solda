import { Routes, Route } from "react-router-dom";
import LeitorRfid from "./Pages/Leitor";
import Funcionarios from "./Pages/Funcionarios";
import Modelos from "./Pages/Modelos";
import Registros from "./Pages/Registros";
import Dashboard from "./Pages/Dashboard";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/leitor" element={<LeitorRfid />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/modelos" element={<Modelos />} />
      <Route path="/registros" element={<Registros />} />
     
    </Routes>
  )
}

export default App
