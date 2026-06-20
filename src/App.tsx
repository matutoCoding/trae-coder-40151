import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Queue from "@/pages/Queue";
import Priority from "@/pages/Priority";
import Schedule from "@/pages/Schedule";
import Followups from "@/pages/Followups";
import Conflict from "@/pages/Conflict";
import Chairs from "@/pages/Chairs";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/priority" element={<Priority />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/conflict" element={<Conflict />} />
          <Route path="/chairs" element={<Chairs />} />
        </Route>
      </Routes>
    </Router>
  );
}
