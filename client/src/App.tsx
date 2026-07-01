import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Positions } from "./pages/Positions";
import { Profile } from "./pages/Profile";
import { MyCvs } from "./pages/MyCvs";
import { Search } from "./pages/Search";
import { NotFound } from "./pages/NotFound";
import { CvView } from "./pages/CvView";
import { AttributeLibrary } from "./pages/AttributeLibrary";
import { PositionDetail } from "./pages/PositionDetail";
import { AdminUsers } from "./pages/AdminUsers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="positions" element={<Positions />} />
          <Route path="positions/:id" element={<PositionDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-cvs" element={<MyCvs />} />
          <Route path="cvs/:id" element={<CvView />} />
          <Route path="attributes" element={<AttributeLibrary />} />
          <Route path="search" element={<Search />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;