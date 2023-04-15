import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Pipeline from "./Pipeline";
import ShowFile from "./Pipeline/ShowFile";
import NoPage from "./NoPage";
import TapInstance from "./Dashboard"
import Form from "./Dashboard/Form"
import Reports from "./Pipeline/Reports";
import WelcomePage from "./Login/Welcome"
import Compare from "./Compare"
import Login from "./Login/Login"
import SignUp from "./Login/SignUp"
import { RequireAuthProvider } from "./utility/RequireAuth"
import PrivateRoute from "./PrivateRoute";
import Coverage from "./Pipeline/Coverage";


const URLS = () => {
  return (
    <BrowserRouter>
      <RequireAuthProvider>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>}>
            <Route path="/home" element={<WelcomePage />} />
            <Route path="pipeline/:instance_name/:tap_name" element={<Pipeline />} />
            <Route path="pipeline/:instance_name/:tap_name/report" element={<Reports />} />
            <Route path="pipeline/:instance_name/:tap_name/:file" element={<ShowFile />} />
            <Route path="pipeline/coverage/:instance_name/:tap_name/:file" element={<Coverage />} />
            <Route path="tap/create" element={<Form />} />
            <Route path="tap/update/:instance" element={<Form />} />
            <Route path="tap/compare/:instance_1&:instance_2" element={<Compare />} />
            <Route path="tap" element={<TapInstance />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </RequireAuthProvider>
    </BrowserRouter >
  );
}

export default URLS;
