import { Routes, Route, HashRouter } from 'react-router-dom';
import Header from '../components/Header';
import LoginPage from '../pages/LoginPage';
import BalanceListPage from '../pages/BalanceListPage';
import ContextWrapper from './ContextWrapper';
import PageTemplate from './PageTemplate';
import BalancePage from '../pages/BalancePage';
import BalanceJoinPage from '../pages/BalanceJoinPage';

/**
 *
 * @return {JSX.Element}
 */
export default function Routing() {
  return (
    <HashRouter>
      <ContextWrapper>
        <>
          <Header />
          <PageTemplate>
            <Routes>
              <Route path='/' element={<BalanceListPage />} />
              <Route path='/login' element={<LoginPage />}></Route>
              <Route
                path='/balance/:balanceId'
                element={<BalancePage />}
              ></Route>

              <Route
                path='/join-balance/:balanceId'
                element={<BalanceJoinPage />}
              ></Route>
            </Routes>
          </PageTemplate>
        </>
      </ContextWrapper>
    </HashRouter>
  );
}
