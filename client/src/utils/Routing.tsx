import { Routes, Route, HashRouter } from 'react-router-dom';
import Header from '../components/Header';
import LoginPage from '../pages/LoginPage';
import GroupListPage from '../pages/GroupListPage';
import PageTemplate from './PageTemplate';
import GroupPage from '../pages/GroupPage';
import GroupJoinPage from '../pages/GroupJoinPage';
import RegistrationPage from '../pages/RegistrationPage';

/**
 *
 * @return {JSX.Element}
 */
export default function Routing() {
  return (
    <HashRouter>
      <Header />
      <PageTemplate>
        <Routes>
          <Route path='/' element={<GroupListPage />} />
          <Route path='/login' element={<LoginPage />}></Route>
          <Route path='/registration' element={<RegistrationPage />}></Route>
          <Route path='/group/:groupId' element={<GroupPage />}></Route>
          <Route
            path='/group/:groupId/join'
            element={<GroupJoinPage />}
          ></Route>
        </Routes>
      </PageTemplate>
    </HashRouter>
  );
}
