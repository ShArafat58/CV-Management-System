import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Positions } from "./pages/Positions";
import { Profile } from "./pages/Profile";
import { MyCvs } from "./pages/MyCvs";
import { Search } from "./pages/Search";
import { NotFound } from "./pages/NotFound";
import { AttributeLibrary } from "./pages/AttributeLibrary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="positions" element={<Positions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-cvs" element={<MyCvs />} />
          <Route path="attributes" element={<AttributeLibrary />} />
          <Route path="search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;