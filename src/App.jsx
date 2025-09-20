import { useState } from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ShortcutProvider } from "./context/ShortcutContext";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <ShortcutProvider>
            <AppRoutes />
          </ShortcutProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
