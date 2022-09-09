import './App.css';
import Theme from './utils/Theme';
import Routing from './utils/Routing';
import ContextWrapper from './utils/ContextWrapper';

/**
 *
 * @return {JSX.Element}
 */
function App() {
  return (
    <ContextWrapper>
      <Theme>
        <Routing />
      </Theme>
    </ContextWrapper>
  );
}

export default App;
